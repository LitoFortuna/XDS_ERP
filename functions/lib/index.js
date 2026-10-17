"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendClassReminders = exports.teacherSaveAttendance = exports.teacherOverview = exports.manageInstructorAccount = exports.scheduledFirestoreBackup = exports.purgeTrash = exports.checkSpecialDates = exports.joinEvent = exports.studentPurchase = exports.studentLogin = exports.onChangeRequestReviewed = exports.getVapidPublicKey = exports.onNewActivityLog = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const webpush = require("web-push");
const crypto_1 = require("crypto");
const classReminders_1 = require("./classReminders");
const teacherData_1 = require("./teacherData");
admin.initializeApp();
// VAPID keys for Web Push — loaded from functions/.env (gitignored), never hardcoded in source.
// Rotate by regenerating with `npx web-push generate-vapid-keys`, updating .env, and also
// updating VAPID_PUBLIC_KEY in src/config/vapidKeys.ts on the client (that one's fine to commit
// — only the private key is a secret). Rotating invalidates existing push subscriptions;
// notificationUtils.subscribeToPush() detects the mismatch and silently resubscribes.
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = 'mailto:raulfdz3@gmail.com';
// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}
else {
    console.error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY missing from environment — push notifications will fail.');
}
/**
 * Triggered when a new activity log is created
 * Sends push notification to SuperAdmin
 */
exports.onNewActivityLog = (0, firestore_1.onDocumentCreated)('activityLogs/{logId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log('No data associated with the event');
        return;
    }
    const activityData = snapshot.data();
    if (!activityData || activityData.targetRole !== 'SuperAdmin') {
        console.log('Activity not targeted at SuperAdmin, skipping');
        return;
    }
    console.log('New activity for SuperAdmin:', activityData.description);
    // Get all SuperAdmin push subscriptions
    const superAdminProfiles = await admin.firestore()
        .collection('userProfiles')
        .where('role', '==', 'SuperAdmin')
        .get();
    const notifications = [];
    for (const doc of superAdminProfiles.docs) {
        const profile = doc.data();
        if (profile.pushSubscription) {
            try {
                const subscription = JSON.parse(profile.pushSubscription);
                const payload = JSON.stringify({
                    title: '📣 Nueva Actividad - XDS ERP',
                    body: activityData.description,
                    icon: '/android-chrome-192x192.png',
                    badge: '/android-chrome-192x192.png',
                    badgeCount: 1,
                    data: {
                        url: '/',
                        type: activityData.type
                    }
                });
                notifications.push(webpush.sendNotification(subscription, payload)
                    .catch((error) => {
                    console.error('Error sending notification:', error);
                    if (error.statusCode === 410) {
                        return admin.firestore()
                            .collection('userProfiles')
                            .doc(doc.id)
                            .update({ pushSubscription: admin.firestore.FieldValue.delete() });
                    }
                    return null;
                }));
            }
            catch (e) {
                console.error('Error parsing subscription:', e);
            }
        }
    }
    await Promise.all(notifications);
    console.log(`Sent ${notifications.length} push notifications`);
});
/**
 * HTTP endpoint to get VAPID public key
 */
exports.getVapidPublicKey = (0, https_1.onRequest)({ cors: true }, (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});
// Envía una notificación push a una alumna concreta (Portal), leyendo su suscripción de
// studentPushSubscriptions/{studentId} -- ver src/utils/notificationUtils.ts::subscribeStudentToPush.
// Si el envío falla con 410 (Gone), la suscripción ya no es válida (se desinstaló la PWA, cambió
// de navegador, etc.) y se borra para no seguir intentando en cada aviso futuro.
async function sendPushToStudent(studentId, payload) {
    const subDoc = await admin.firestore().collection('studentPushSubscriptions').doc(studentId).get();
    if (!subDoc.exists)
        return;
    try {
        const subscription = JSON.parse(subDoc.data().subscription);
        await webpush.sendNotification(subscription, JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: '/android-chrome-192x192.png',
            badge: '/android-chrome-192x192.png',
            data: { url: payload.url || '/portal' },
        }));
    }
    catch (error) {
        console.error(`[sendPushToStudent] Error enviando a ${studentId}:`, error);
        if (error.statusCode === 410) {
            await admin.firestore().collection('studentPushSubscriptions').doc(studentId).delete();
        }
    }
}
/**
 * Avisa a la alumna en cuanto un admin aprueba o rechaza su solicitud de cambio de datos, en vez
 * de que tenga que volver a abrir el Portal para enterarse.
 */
exports.onChangeRequestReviewed = (0, firestore_1.onDocumentUpdated)('changeRequests/{requestId}', async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    if (before.status === after.status)
        return; // solo interesa el cambio de estado
    if (after.status !== 'Aprobada' && after.status !== 'Rechazada')
        return;
    await sendPushToStudent(after.studentId, {
        title: after.status === 'Aprobada' ? '✅ Solicitud aprobada' : '❌ Solicitud rechazada',
        body: after.status === 'Aprobada'
            ? 'Tu solicitud de cambio de datos ha sido aprobada.'
            : `Tu solicitud de cambio de datos ha sido rechazada.${after.reviewNotes ? ` Motivo: ${after.reviewNotes}` : ''}`,
        url: '/portal',
    });
});
/**
 * Callable used by the Student Portal login. The portal has no real session today — it just
 * trusts whatever studentId is in localStorage. This verifies phone+password server-side
 * (Admin SDK, so it can check the password regardless of Firestore rules) and, on success,
 * mints a real Firebase Auth custom token with uid == studentId. The client exchanges it via
 * signInWithCustomToken, which is what lets firestore.rules grant that student read access to
 * her own students/{id}/private/sensitive doc (DNI/IBAN) without making it public.
 */
exports.studentLogin = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a, _b, _c, _d;
    const phone = (_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.phone) === null || _b === void 0 ? void 0 : _b.trim();
    const password = (_d = (_c = request.data) === null || _c === void 0 ? void 0 : _c.password) !== null && _d !== void 0 ? _d : '';
    if (!phone || !password) {
        throw new https_1.HttpsError('invalid-argument', 'Falta teléfono o contraseña.');
    }
    const snapshot = await admin.firestore()
        .collection('students')
        .where('phone', '==', phone)
        .limit(1)
        .get();
    if (snapshot.empty) {
        throw new https_1.HttpsError('not-found', 'No se encontró ningún alumno con ese teléfono.');
    }
    const studentDoc = snapshot.docs[0];
    const student = studentDoc.data();
    // Un alumno en la Papelera (soft-delete, ver trashService.ts) solo tiene deletedAt marcado --
    // active no se toca al borrar -- así que sin esta comprobación seguiría pudiendo entrar y leer
    // su propio DNI/IBAN hasta que purgeTrash lo borre de verdad a los 30 días.
    if (student.deletedAt || !student.active) {
        throw new https_1.HttpsError('permission-denied', 'Este alumno no está activo. Contacta con la administración.');
    }
    // Misma lógica de contraseña que StudentLogin.tsx (PrimerApellido + 2026), verificada aquí
    // para poder emitir una sesión real de Firebase Auth.
    const parts = String(student.name || '').trim().split(/\s+/);
    const surname = parts.length > 1 ? parts[1] : parts[0];
    const expectedPassword = `${surname}2026`.toLowerCase();
    if (password.toLowerCase() !== expectedPassword) {
        throw new https_1.HttpsError('unauthenticated', 'Contraseña incorrecta.');
    }
    const token = await admin.auth().createCustomToken(studentDoc.id);
    return { token, studentId: studentDoc.id };
});
// Comprueba que quien llama es una alumna autenticada (uid == su propio studentId) y activa/no
// borrada -- las tres funciones de autoservicio del Portal (compra, unirse a evento) comparten
// esta misma comprobación antes de tocar nada.
async function requireActiveStudent(request) {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Debes iniciar sesión en el Portal.');
    }
    const studentSnap = await admin.firestore().collection('students').doc(request.auth.uid).get();
    if (!studentSnap.exists) {
        throw new https_1.HttpsError('not-found', 'No se encontró tu ficha de alumna.');
    }
    const student = studentSnap.data();
    if (student.deletedAt || !student.active) {
        throw new https_1.HttpsError('permission-denied', 'Tu cuenta no está activa. Contacta con administración.');
    }
    return student;
}
/**
 * Autoservicio de compra en la Tienda del Portal. merchandiseItems/merchandiseSales son
 * escritura solo-admin en firestore.rules (para que nadie manipule precio/stock desde el
 * navegador), así que la compra pasa por aquí: se valida la alumna, se comprueba stock dentro de
 * una transacción (evita que dos compras simultáneas dejen el stock en negativo) y se descuenta
 * atómicamente junto con crear el registro de venta. El pago/recogida sigue siendo en persona,
 * como ya hacía el flujo antiguo de WhatsApp -- esto solo reserva el artículo y descuenta stock.
 */
exports.studentPurchase = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a, _b, _c;
    const student = await requireActiveStudent(request);
    const studentId = request.auth.uid;
    const itemId = (_a = request.data) === null || _a === void 0 ? void 0 : _a.itemId;
    const quantity = Number((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.quantity) !== null && _c !== void 0 ? _c : 1);
    if (!itemId || !Number.isInteger(quantity) || quantity <= 0 || quantity > 10) {
        throw new https_1.HttpsError('invalid-argument', 'Solicitud de compra no válida.');
    }
    const itemRef = admin.firestore().collection('merchandiseItems').doc(itemId);
    const saleRef = admin.firestore().collection('merchandiseSales').doc();
    await admin.firestore().runTransaction(async (tx) => {
        const itemDoc = await tx.get(itemRef);
        if (!itemDoc.exists) {
            throw new https_1.HttpsError('not-found', 'El artículo ya no está disponible.');
        }
        const item = itemDoc.data();
        const currentStock = item.stock || 0;
        if (currentStock < quantity) {
            throw new https_1.HttpsError('failed-precondition', 'No queda stock suficiente.');
        }
        tx.update(itemRef, { stock: currentStock - quantity });
        tx.set(saleRef, {
            itemId,
            itemName: item.name || 'Artículo',
            studentId,
            quantity,
            totalAmount: (item.salePrice || 0) * quantity,
            saleDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'Efectivo',
            notes: `Reserva autoservicio desde el Portal — pendiente de recoger y pagar en el estudio (${student.name || studentId}).`,
        });
    });
    return { saleId: saleRef.id };
});
/**
 * Autoservicio de inscripción a un evento abierto desde el Portal. events es escritura
 * solo-admin, así que unirse pasa por aquí -- comprueba aforo (si el evento tiene `capacity`) de
 * forma atómica para no sobre-inscribir con inscripciones simultáneas, y evita duplicar si la
 * alumna ya estaba apuntada.
 */
exports.joinEvent = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a;
    const student = await requireActiveStudent(request);
    const studentId = request.auth.uid;
    const eventId = (_a = request.data) === null || _a === void 0 ? void 0 : _a.eventId;
    if (!eventId) {
        throw new https_1.HttpsError('invalid-argument', 'Falta el evento.');
    }
    const eventRef = admin.firestore().collection('events').doc(eventId);
    await admin.firestore().runTransaction(async (tx) => {
        const eventDoc = await tx.get(eventRef);
        if (!eventDoc.exists) {
            throw new https_1.HttpsError('not-found', 'El evento ya no está disponible.');
        }
        const event = eventDoc.data();
        if (event.deletedAt) {
            throw new https_1.HttpsError('not-found', 'El evento ya no está disponible.');
        }
        const participants = event.participants || [];
        if (participants.some(p => p.studentId === studentId)) {
            return; // ya estaba apuntada -- no es un error, simplemente no hace nada más
        }
        if (typeof event.capacity === 'number' && participants.length >= event.capacity) {
            throw new https_1.HttpsError('failed-precondition', 'El evento ya está completo.');
        }
        tx.update(eventRef, {
            participants: [...participants, { studentId, ticketCount: 1 }],
            studentIds: admin.firestore.FieldValue.arrayUnion(studentId),
        });
    });
    return { studentName: student.name };
});
const scheduler_1 = require("firebase-functions/v2/scheduler");
const nodemailer = require("nodemailer");
// Configure Nodemailer transporter (Gmail)
// IMPORTANT: For Gmail, you might need an App Password if 2FA is enabled.
// Best practice: Use environment variables: defineString('GMAIL_USER')
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'tu-email@gmail.com',
        pass: process.env.GMAIL_PASS || 'tu-password'
    }
});
/**
 * Scheduled task to check for birthdays and anniversaries
 * Runs every day at 09:00 AM (Europe/Madrid)
 */
exports.checkSpecialDates = (0, scheduler_1.onSchedule)({
    schedule: '0 9 * * *',
    timeZone: 'Europe/Madrid',
}, async (event) => {
    console.log('Checking special dates (Birthdays & Anniversaries)...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();
    try {
        const studentsSnapshot = await admin.firestore().collection('students').where('active', '==', true).get();
        const promises = [];
        studentsSnapshot.forEach(doc => {
            const student = doc.data();
            // Alumna en la Papelera (soft-delete): active no se toca al borrar, solo deletedAt --
            // sin este filtro seguiría recibiendo emails de cumpleaños/aniversario hasta la purga.
            if (student.deletedAt)
                return;
            // Check Birthday
            if (student.birthDate) {
                const birthDate = new Date(student.birthDate);
                // Handle date parsing carefully if format varies, ideally it's ISO YYYY-MM-DD
                const birthMonth = birthDate.getMonth() + 1;
                const birthDay = birthDate.getDate();
                if (birthMonth === currentMonth && birthDay === currentDay) {
                    console.log(`🎂 It's ${student.name}'s birthday!`);
                    if (student.email) {
                        promises.push(sendBirthdayEmail(student.email, student.name));
                    }
                }
            }
            // Check Anniversary
            if (student.enrollmentDate) {
                const enrollDate = new Date(student.enrollmentDate);
                const enrollMonth = enrollDate.getMonth() + 1;
                const enrollDay = enrollDate.getDate();
                const years = now.getFullYear() - enrollDate.getFullYear();
                if (enrollMonth === currentMonth && enrollDay === currentDay && years > 0) {
                    console.log(`💃 It's ${student.name}'s ${years} year anniversary!`);
                    if (student.email) {
                        promises.push(sendAnniversaryEmail(student.email, student.name, years));
                    }
                }
            }
        });
        await Promise.all(promises);
        console.log(`Processed ${promises.length} special date emails.`);
    }
    catch (error) {
        console.error('Error checking special dates:', error);
    }
});
async function sendBirthdayEmail(email, name) {
    const mailOptions = {
        from: '"Xen Dance Space" <info@xendance.space>',
        to: email,
        subject: '¡Feliz Cumpleaños! 🎂',
        html: `
            <div style="font-family: sans-serif; text-align: center; color: #333;">
                <h1 style="color: #6b21a8;">¡Feliz Cumpleaños, ${name.split(' ')[0]}! 🎉</h1>
                <p>Desde Xen Dance Space queremos desearte un día lleno de ritmo y alegría.</p>
                <p>Esperamos que disfrutes mucho de tu día y que sigamos compartiendo muchos más momentos de baile juntos.</p>
                <div style="margin-top: 20px;">
                    <p>¡Que el ritmo no pare! 💃🕺</p>
                </div>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}
// --- Papelera: purga automática ---
// Las colecciones con "borrado suave" (deletedAt en vez de deleteDoc real, ver
// src/services/domain/trashService.ts). Pasados 30 días desde deletedAt, se borran de verdad.
const TRASH_COLLECTIONS = ['students', 'classes', 'instructors', 'payments', 'costs', 'events', 'nuptialDances'];
const PURGE_AFTER_DAYS = 30;
/**
 * Se ejecuta cada día a las 04:00 (Europe/Madrid, hora de bajo tráfico) y borra
 * definitivamente cualquier documento marcado como borrado hace más de 30 días.
 */
// Firestore no admite más de 500 operaciones por batch. Sin trocear, una colección con más de
// 500 documentos caducados de golpe (payments/attendance son las que más crecen con los años)
// haría fallar el commit entero y, sin try/catch, abortaría también la purga de las colecciones
// siguientes -- un atasco que solo podría crecer, ya que nunca llegaría a purgarse nada.
const FIRESTORE_BATCH_LIMIT = 500;
const chunk = (items, size) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += size)
        chunks.push(items.slice(i, i + size));
    return chunks;
};
exports.purgeTrash = (0, scheduler_1.onSchedule)({
    schedule: '0 4 * * *',
    timeZone: 'Europe/Madrid',
    retryCount: 2,
}, async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PURGE_AFTER_DAYS);
    const cutoffIso = cutoff.toISOString();
    let totalPurged = 0;
    for (const collectionName of TRASH_COLLECTIONS) {
        try {
            const snapshot = await admin.firestore()
                .collection(collectionName)
                .where('deletedAt', '<=', cutoffIso)
                .get();
            if (snapshot.empty)
                continue;
            for (const docsChunk of chunk(snapshot.docs, FIRESTORE_BATCH_LIMIT)) {
                const batch = admin.firestore().batch();
                docsChunk.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
            console.log(`[purgeTrash] ${collectionName}: ${snapshot.size} documento(s) purgado(s) definitivamente.`);
            totalPurged += snapshot.size;
        }
        catch (error) {
            // Una colección que falla no debe impedir que se intenten las demás.
            console.error(`[purgeTrash] Error purgando ${collectionName}:`, error);
        }
    }
    console.log(`[purgeTrash] Total purgado: ${totalPurged} documento(s).`);
});
// --- Backups automáticos de Firestore ---
// Export nativo de Firestore a Cloud Storage (mismo mecanismo que "gcloud firestore export").
// Corre bajo la identidad de la cuenta de servicio firebase-adminsdk (la misma que ya usa
// mcp-server), en vez de la cuenta de servicio por defecto de la función, para no tener que dar
// de alta un permiso nuevo por cada función que necesite exportar en el futuro.
//
// IMPORTANTE (paso manual único, no lo puede hacer este código): la cuenta de servicio
// firebase-adminsdk-fbsvc@xen-dance-erp.iam.gserviceaccount.com necesita el rol
// "Cloud Datastore Import Export Admin" (roles/datastore.importExportAdmin) en Google Cloud
// Console → IAM. Sin ese rol, el export falla con PERMISSION_DENIED — verificado directamente
// contra el proyecto real durante el desarrollo de esta función.
const firestore_2 = require("@google-cloud/firestore");
const BACKUP_SERVICE_ACCOUNT = 'firebase-adminsdk-fbsvc@xen-dance-erp.iam.gserviceaccount.com';
const BACKUP_BUCKET = 'gs://xen-dance-erp.firebasestorage.app/firestore-backups';
exports.scheduledFirestoreBackup = (0, scheduler_1.onSchedule)({
    schedule: '0 3 * * *', // Cada día a las 03:00, antes de la purga de la papelera (04:00)
    timeZone: 'Europe/Madrid',
    serviceAccount: BACKUP_SERVICE_ACCOUNT,
    retryCount: 2,
}, async () => {
    const client = new firestore_2.v1.FirestoreAdminClient();
    const projectId = process.env.GCLOUD_PROJECT || 'xen-dance-erp';
    const databaseName = client.databasePath(projectId, '(default)');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputUriPrefix = `${BACKUP_BUCKET}/${timestamp}`;
    console.log(`[scheduledFirestoreBackup] Exportando a ${outputUriPrefix}...`);
    const [operation] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix,
    });
    console.log(`[scheduledFirestoreBackup] Export en curso, operación: ${operation.name}`);
});
// --- Acceso de profesores al ERP ---
// Un profesor entra con email y contraseña (Firebase Auth) y un custom claim { role: 'Instructor',
// instructorId }. NO lee Firestore directamente (las reglas no cambian: alumnas, pagos, etc. siguen
// cerrados): todo lo suyo pasa por teacherOverview / teacherSaveAttendance, que solo devuelven o
// aceptan datos de SUS clases. instructorAccounts/{instructorId} (solo SDK admin, sin reglas de
// cliente = denegado) guarda el uid vinculado, de modo que revocar el acceso surte efecto al
// instante aunque su token siga vigente hasta una hora.
function requireAdminCaller(request) {
    var _a, _b;
    const email = (_b = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.email;
    if (!email || !teacherData_1.ADMIN_EMAILS.includes(email)) {
        throw new https_1.HttpsError('permission-denied', 'Solo la administración puede gestionar accesos.');
    }
    return email;
}
// Sin caracteres ambiguos (0/O, 1/l/I) para poder dictarla o copiarla sin errores.
function generateTemporaryPassword(length = 12) {
    const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < length; i++)
        password += alphabet[(0, crypto_1.randomInt)(alphabet.length)];
    return password;
}
/**
 * Crea, restablece o revoca la cuenta de ERP de un profesor. Solo administradores.
 * - create: crea el usuario con el email de la ficha del profesor y una contraseña temporal que se
 *   devuelve UNA vez para que la administración se la entregue.
 * - reset: genera una contraseña temporal nueva (y cierra sus sesiones abiertas).
 * - revoke: borra la cuenta; el profesor deja de poder entrar.
 */
exports.manageInstructorAccount = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a, _b, _c, _d;
    requireAdminCaller(request);
    const action = (_a = request.data) === null || _a === void 0 ? void 0 : _a.action;
    const instructorId = (_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.instructorId) === null || _c === void 0 ? void 0 : _c.trim();
    if (!instructorId || !['create', 'reset', 'revoke'].includes(action || '')) {
        throw new https_1.HttpsError('invalid-argument', 'Solicitud no válida.');
    }
    const db = admin.firestore();
    const instructorRef = db.collection('instructors').doc(instructorId);
    const accountRef = db.collection('instructorAccounts').doc(instructorId);
    const [instructorSnap, accountSnap] = await Promise.all([instructorRef.get(), accountRef.get()]);
    if (!instructorSnap.exists || ((_d = instructorSnap.data()) === null || _d === void 0 ? void 0 : _d.deletedAt)) {
        throw new https_1.HttpsError('not-found', 'No se encontró al profesor.');
    }
    const instructor = instructorSnap.data();
    if (action === 'create') {
        if (accountSnap.exists)
            throw new https_1.HttpsError('already-exists', 'Este profesor ya tiene acceso. Puedes restablecer su contraseña.');
        const email = String(instructor.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new https_1.HttpsError('failed-precondition', 'La ficha del profesor no tiene un email válido. Añádelo antes de crear el acceso.');
        }
        if (teacherData_1.ADMIN_EMAILS.includes(email)) {
            throw new https_1.HttpsError('failed-precondition', 'Ese email pertenece a un administrador.');
        }
        const password = generateTemporaryPassword();
        let user;
        try {
            user = await admin.auth().createUser({ email, password, displayName: String(instructor.name || ''), emailVerified: false });
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.code) === 'auth/email-already-exists') {
                throw new https_1.HttpsError('already-exists', 'Ya existe una cuenta con ese email (por ejemplo, de una alumna). Usa otro email para el profesor.');
            }
            throw error;
        }
        await admin.auth().setCustomUserClaims(user.uid, { role: 'Instructor', instructorId });
        await Promise.all([
            accountRef.set({ uid: user.uid, email, createdAt: new Date().toISOString() }),
            db.collection('userProfiles').doc(user.uid).set({ uid: user.uid, email, role: 'Instructor', name: instructor.name || email.split('@')[0], instructorId }),
            instructorRef.update({ hasAccess: true }),
        ]);
        return { email, password };
    }
    if (!accountSnap.exists)
        throw new https_1.HttpsError('failed-precondition', 'Este profesor todavía no tiene acceso.');
    const { uid, email } = accountSnap.data();
    if (action === 'reset') {
        const password = generateTemporaryPassword();
        await admin.auth().updateUser(uid, { password });
        await admin.auth().revokeRefreshTokens(uid);
        return { email, password };
    }
    // revoke
    try {
        await admin.auth().deleteUser(uid);
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) !== 'auth/user-not-found')
            throw error;
    }
    await Promise.all([
        accountRef.delete(),
        db.collection('userProfiles').doc(uid).delete(),
        instructorRef.update({ hasAccess: false }),
    ]);
    return { ok: true };
});
// Comprueba que quien llama es un profesor con cuenta vigente y devuelve su ficha. Se valida contra
// instructorAccounts (no solo contra el claim del token) para que una revocación sea inmediata.
async function requireInstructor(request) {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const instructorId = request.auth.token.instructorId;
    if (request.auth.token.role !== 'Instructor' || !instructorId) {
        throw new https_1.HttpsError('permission-denied', 'Tu cuenta no tiene acceso de profesor.');
    }
    const db = admin.firestore();
    const [accountSnap, instructorSnap] = await Promise.all([
        db.collection('instructorAccounts').doc(instructorId).get(),
        db.collection('instructors').doc(instructorId).get(),
    ]);
    const instructor = instructorSnap.data();
    if (!accountSnap.exists || ((_a = accountSnap.data()) === null || _a === void 0 ? void 0 : _a.uid) !== request.auth.uid
        || !instructorSnap.exists || !instructor || instructor.deletedAt || instructor.active === false) {
        throw new https_1.HttpsError('permission-denied', 'Tu acceso ya no está activo. Contacta con la administración.');
    }
    return { instructorId, instructor, email: request.auth.token.email };
}
async function getInstructorClassIds(instructorId) {
    const snap = await admin.firestore().collection('classes').where('instructorId', '==', instructorId).get();
    const docs = snap.docs.filter(d => !d.data().deletedAt);
    return { docs, ids: docs.map(d => d.id) };
}
/**
 * Todo lo que necesita el panel del profesor, solo de SUS clases: clases, alumnas activas (datos
 * mínimos), asistencia de los últimos ~13 meses y avisos de ausencia próximos.
 */
exports.teacherOverview = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { instructorId, instructor } = await requireInstructor(request);
    const db = admin.firestore();
    const today = (0, classReminders_1.getMadridNow)(new Date()).dateIso;
    const since = new Date(Date.parse(today + 'T00:00:00Z') - 400 * 86400000).toISOString().slice(0, 10);
    const { docs: classDocs, ids: classIds } = await getInstructorClassIds(instructorId);
    const classes = classDocs.map(d => (0, teacherData_1.toTeacherClass)(d.data(), d.id));
    const classIdSet = new Set(classIds);
    const students = [];
    const attendance = [];
    const absences = [];
    if (classIds.length > 0) {
        const seen = new Set();
        await Promise.all((0, teacherData_1.chunk)(classIds, 10).map(async (ids) => {
            const [studentsSnap, attendanceSnap, absencesSnap] = await Promise.all([
                db.collection('students').where('enrolledClassIds', 'array-contains-any', ids).get(),
                db.collection('attendance').where('classId', 'in', ids).get(),
                db.collection('classAbsences').where('classId', 'in', ids).get(),
            ]);
            studentsSnap.docs.forEach(d => {
                if (seen.has(d.id))
                    return;
                const view = (0, teacherData_1.toTeacherStudent)(d.data(), d.id, classIdSet);
                if (view) {
                    seen.add(d.id);
                    students.push(view);
                }
            });
            attendanceSnap.docs.forEach(d => {
                const r = d.data();
                if (typeof r.date === 'string' && r.date >= since) {
                    attendance.push({ id: d.id, classId: r.classId, date: r.date, presentStudentIds: r.presentStudentIds || [], notes: r.notes });
                }
            });
            absencesSnap.docs.forEach(d => {
                const a = d.data();
                if (typeof a.date === 'string' && a.date >= today) {
                    absences.push({ id: d.id, classId: a.classId, studentId: a.studentId, studentName: a.studentName, date: a.date });
                }
            });
        }));
    }
    students.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return {
        today,
        instructor: { id: instructorId, name: String(instructor.name || '') },
        classes,
        students,
        attendance,
        absences,
    };
});
/**
 * El profesor pasa lista de una de SUS clases. Se valida la clase, la fecha (hoy o hasta 60 días
 * atrás) y que todas las asistentes estén inscritas en esa clase; crea o actualiza el registro de
 * ese día y avisa a la administración como ya hace la asistencia registrada por un Admin.
 */
exports.teacherSaveAttendance = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { instructorId, instructor, email } = await requireInstructor(request);
    const db = admin.firestore();
    const validation = (0, teacherData_1.validateAttendanceInput)(request.data, (0, classReminders_1.getMadridNow)(new Date()).dateIso);
    if (validation.ok === false)
        throw new https_1.HttpsError('invalid-argument', validation.message);
    const { classId, date, presentStudentIds, notes } = validation.value;
    const classSnap = await db.collection('classes').doc(classId).get();
    const danceClass = classSnap.data();
    if (!classSnap.exists || !danceClass || danceClass.deletedAt || danceClass.instructorId !== instructorId) {
        throw new https_1.HttpsError('permission-denied', 'Esa clase no es tuya.');
    }
    const enrolledSnap = await db.collection('students').where('enrolledClassIds', 'array-contains', classId).get();
    const enrolledIds = new Set(enrolledSnap.docs.filter(d => !d.data().deletedAt).map(d => d.id));
    if (presentStudentIds.some(id => !enrolledIds.has(id))) {
        throw new https_1.HttpsError('invalid-argument', 'Hay alumnas que no están inscritas en esta clase.');
    }
    const record = { classId, date, presentStudentIds, notes, recordedByInstructorId: instructorId };
    const existing = await db.collection('attendance').where('classId', '==', classId).where('date', '==', date).limit(1).get();
    let attendanceId;
    if (existing.empty) {
        attendanceId = (await db.collection('attendance').add(record)).id;
    }
    else {
        attendanceId = existing.docs[0].id;
        await existing.docs[0].ref.set(record);
    }
    await db.collection('activityLogs').add({
        type: 'attendance',
        actorEmail: email || '',
        actorName: instructor.name || '',
        description: `Asistencia registrada por ${instructor.name || 'un profesor'}: ${danceClass.name} el ${date.split('-').reverse().join('/')} (${presentStudentIds.length} presentes)`,
        targetRole: 'SuperAdmin',
        timestamp: new Date().toISOString(),
        read: false,
    });
    return { id: attendanceId };
});
// --- Recordatorio push de clase para las alumnas del Portal ---
// Corre cada 15 min y avisa a las alumnas inscritas unas 2 horas antes de cada clase (nunca antes
// de las 08:00, ver classReminders.ts). Se salta a quien ya avisó de que no va a esa sesión y no
// repite el aviso si la función se reintenta o se solapa: cada (fecha, clase) se "reserva" creando
// classReminderLog/{fecha}_{claseId}; si ya existía, otra ejecución lo envió ya.
exports.sendClassReminders = (0, scheduler_1.onSchedule)({
    schedule: '*/15 * * * *',
    timeZone: 'Europe/Madrid',
    retryCount: 0,
}, async () => {
    var _a;
    const db = admin.firestore();
    const now = (0, classReminders_1.getMadridNow)(new Date());
    const classesSnap = await db.collection('classes').get();
    const dueClasses = (0, classReminders_1.classesDueNow)(classesSnap.docs.map(d => (Object.assign({ id: d.id }, d.data()))), now);
    if (dueClasses.length === 0)
        return;
    for (const danceClass of dueClasses) {
        try {
            try {
                await db.collection('classReminderLog').doc(`${now.dateIso}_${danceClass.id}`).create({
                    sentAt: new Date().toISOString(),
                    className: danceClass.name,
                });
            }
            catch (error) {
                if ((error === null || error === void 0 ? void 0 : error.code) === 6)
                    continue; // ALREADY_EXISTS: ya se avisó de esta sesión
                throw error;
            }
            const [studentsSnap, absencesSnap, instructorDoc] = await Promise.all([
                db.collection('students').where('enrolledClassIds', 'array-contains', danceClass.id).get(),
                db.collection('classAbsences').where('classId', '==', danceClass.id).where('date', '==', now.dateIso).get(),
                danceClass.instructorId ? db.collection('instructors').doc(danceClass.instructorId).get() : Promise.resolve(null),
            ]);
            const absentIds = new Set(absencesSnap.docs.map(d => d.data().studentId));
            const instructorName = (instructorDoc === null || instructorDoc === void 0 ? void 0 : instructorDoc.exists) ? (_a = instructorDoc.data()) === null || _a === void 0 ? void 0 : _a.name : undefined;
            const recipients = studentsSnap.docs.filter(d => {
                const s = d.data();
                return s.active && !s.deletedAt && !absentIds.has(d.id);
            });
            await Promise.all(recipients.map(d => sendPushToStudent(d.id, {
                title: `💃 ${danceClass.name} a las ${danceClass.startTime}`,
                body: `Tu clase es hoy a las ${danceClass.startTime}${instructorName ? ` con ${instructorName}` : ''}. ¡Te esperamos!`,
                url: '/portal',
            })));
            console.log(`[sendClassReminders] ${danceClass.name} (${now.dateIso}, aviso ${classReminders_1.REMINDER_LEAD_MINUTES} min antes): ${recipients.length} alumna(s) avisada(s), ${absentIds.size} ausencia(s) avisada(s).`);
        }
        catch (error) {
            // Una clase que falla no debe impedir los avisos de las demás.
            console.error(`[sendClassReminders] Error con la clase ${danceClass.id}:`, error);
        }
    }
});
async function sendAnniversaryEmail(email, name, years) {
    const mailOptions = {
        from: '"Xen Dance Space" <info@xendance.space>',
        to: email,
        subject: `¡${years} año${years > 1 ? 's' : ''} bailando juntos! 💃`,
        html: `
            <div style="font-family: sans-serif; text-align: center; color: #333;">
                <h1 style="color: #db2777;">¡Feliz Aniversario, ${name.split(' ')[0]}!</h1>
                <p>Hoy hace <strong>${years} año${years > 1 ? 's' : ''}</strong> que empezaste tu aventura en Xen Dance Space.</p>
                <p>Gracias por tu energía, tu esfuerzo y por cada paso que has dado con nosotros.</p>
                <p>¡A por muchos más bailes! 👯‍♀️</p>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}
//# sourceMappingURL=index.js.map