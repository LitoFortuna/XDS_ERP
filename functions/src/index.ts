import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as webpush from 'web-push';
import { randomInt } from 'crypto';
import { buildInstructorWelcomeEmail } from './emailTemplates';
import { classesDueNow, getMadridNow, buildReminderMessage, REMINDER_LEAD_MINUTES, ReminderClass, ReminderItem } from './classReminders';
import {
    ADMIN_EMAILS, chunk as chunkArray, toTeacherStudent, toTeacherClass, toTeacherEvent, validateAttendanceInput,
    classInstructorIds, teacherGroupScope, isStudentInScope, composeNotes, mergePresent, studentInstructorIds, NoteEntry,
    TeacherStudentView, TeacherEventView,
} from './teacherData';

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
} else {
    console.error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY missing from environment — push notifications will fail.');
}

// Los triggers de Firestore se entregan "al menos una vez": ante un reintento el mismo evento puede llegar
// dos veces y mandar el push repetido. Cada evento se reserva creando pushEventLog/{eventId}; si ya
// existía, ya se atendió y se ignora.
async function claimEvent(eventId: string): Promise<boolean> {
    try {
        await admin.firestore().collection('pushEventLog').doc(eventId).create({ at: new Date().toISOString() });
        return true;
    } catch (error: any) {
        if (error?.code === 6) return false; // ALREADY_EXISTS
        throw error;
    }
}

/**
 * Triggered when a new activity log is created
 * Sends push notification to SuperAdmin
 */
export const onNewActivityLog = onDocumentCreated('activityLogs/{logId}', async (event) => {
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

    if (!(await claimEvent(event.id))) {
        console.log('Evento ya atendido, se ignora el reintento:', event.id);
        return;
    }

    console.log('New activity for SuperAdmin:', activityData.description);

    // Get all SuperAdmin push subscriptions
    const superAdminProfiles = await admin.firestore()
        .collection('userProfiles')
        .where('role', '==', 'SuperAdmin')
        .get();

    const notifications: Promise<any>[] = [];

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
                    // Misma etiqueta por tipo: una ráfaga de actividad se sustituye en vez de apilarse.
                    tag: `activity-${activityData.type || 'general'}`,
                    data: {
                        url: '/',
                        type: activityData.type
                    }
                });

                notifications.push(
                    webpush.sendNotification(subscription, payload)
                        .catch((error: any) => {
                            console.error('Error sending notification:', error);
                            if (error.statusCode === 410) {
                                return admin.firestore()
                                    .collection('userProfiles')
                                    .doc(doc.id)
                                    .update({ pushSubscription: admin.firestore.FieldValue.delete() });
                            }
                            return null;
                        })
                );
            } catch (e) {
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
export const getVapidPublicKey = onRequest({ cors: true }, (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Envía una notificación push a una alumna concreta (Portal), leyendo su suscripción de
// studentPushSubscriptions/{studentId} -- ver src/utils/notificationUtils.ts::subscribeStudentToPush.
// Si el envío falla con 410 (Gone), la suscripción ya no es válida (se desinstaló la PWA, cambió
// de navegador, etc.) y se borra para no seguir intentando en cada aviso futuro.
async function sendPushToStudent(studentId: string, payload: { title: string; body: string; url?: string; tag?: string }) {
    const subDoc = await admin.firestore().collection('studentPushSubscriptions').doc(studentId).get();
    if (!subDoc.exists) return;

    try {
        const subscription = JSON.parse(subDoc.data()!.subscription);
        await webpush.sendNotification(subscription, JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: '/android-chrome-192x192.png',
            badge: '/android-chrome-192x192.png',
            tag: payload.tag,
            data: { url: payload.url || '/portal' },
        }));
    } catch (error: any) {
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
export const onChangeRequestReviewed = onDocumentUpdated('changeRequests/{requestId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status) return; // solo interesa el cambio de estado
    if (after.status !== 'Aprobada' && after.status !== 'Rechazada') return;
    if (!(await claimEvent(event.id))) return; // reintento del mismo evento

    await sendPushToStudent(after.studentId, {
        title: after.status === 'Aprobada' ? '✅ Solicitud aprobada' : '❌ Solicitud rechazada',
        body: after.status === 'Aprobada'
            ? 'Tu solicitud de cambio de datos ha sido aprobada.'
            : `Tu solicitud de cambio de datos ha sido rechazada.${after.reviewNotes ? ` Motivo: ${after.reviewNotes}` : ''}`,
        url: '/portal',
        tag: `change-request-${event.params.requestId}`,
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
export const studentLogin = onCall({ cors: true }, async (request) => {
    const phone = (request.data?.phone as string | undefined)?.trim();
    const password = (request.data?.password as string | undefined) ?? '';

    if (!phone || !password) {
        throw new HttpsError('invalid-argument', 'Falta teléfono o contraseña.');
    }

    const snapshot = await admin.firestore()
        .collection('students')
        .where('phone', '==', phone)
        .limit(1)
        .get();

    if (snapshot.empty) {
        throw new HttpsError('not-found', 'No se encontró ningún alumno con ese teléfono.');
    }

    const studentDoc = snapshot.docs[0];
    const student = studentDoc.data();

    // Un alumno en la Papelera (soft-delete, ver trashService.ts) solo tiene deletedAt marcado --
    // active no se toca al borrar -- así que sin esta comprobación seguiría pudiendo entrar y leer
    // su propio DNI/IBAN hasta que purgeTrash lo borre de verdad a los 30 días.
    if (student.deletedAt || !student.active) {
        throw new HttpsError('permission-denied', 'Este alumno no está activo. Contacta con la administración.');
    }

    // Misma lógica de contraseña que StudentLogin.tsx (PrimerApellido + 2026), verificada aquí
    // para poder emitir una sesión real de Firebase Auth.
    const parts = String(student.name || '').trim().split(/\s+/);
    const surname = parts.length > 1 ? parts[1] : parts[0];
    const expectedPassword = `${surname}2026`.toLowerCase();

    if (password.toLowerCase() !== expectedPassword) {
        throw new HttpsError('unauthenticated', 'Contraseña incorrecta.');
    }

    const token = await admin.auth().createCustomToken(studentDoc.id);
    return { token, studentId: studentDoc.id };
});

// Comprueba que quien llama es una alumna autenticada (uid == su propio studentId) y activa/no
// borrada -- las tres funciones de autoservicio del Portal (compra, unirse a evento) comparten
// esta misma comprobación antes de tocar nada.
async function requireActiveStudent(request: { auth?: { uid: string } | null }): Promise<FirebaseFirestore.DocumentData> {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Debes iniciar sesión en el Portal.');
    }
    const studentSnap = await admin.firestore().collection('students').doc(request.auth.uid).get();
    if (!studentSnap.exists) {
        throw new HttpsError('not-found', 'No se encontró tu ficha de alumna.');
    }
    const student = studentSnap.data()!;
    if (student.deletedAt || !student.active) {
        throw new HttpsError('permission-denied', 'Tu cuenta no está activa. Contacta con administración.');
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
export const studentPurchase = onCall({ cors: true }, async (request) => {
    const student = await requireActiveStudent(request);
    const studentId = request.auth!.uid;
    const itemId = request.data?.itemId as string | undefined;
    const quantity = Number(request.data?.quantity ?? 1);

    if (!itemId || !Number.isInteger(quantity) || quantity <= 0 || quantity > 10) {
        throw new HttpsError('invalid-argument', 'Solicitud de compra no válida.');
    }

    const itemRef = admin.firestore().collection('merchandiseItems').doc(itemId);
    const saleRef = admin.firestore().collection('merchandiseSales').doc();

    await admin.firestore().runTransaction(async (tx) => {
        const itemDoc = await tx.get(itemRef);
        if (!itemDoc.exists) {
            throw new HttpsError('not-found', 'El artículo ya no está disponible.');
        }
        const item = itemDoc.data()!;
        const currentStock = item.stock || 0;
        if (currentStock < quantity) {
            throw new HttpsError('failed-precondition', 'No queda stock suficiente.');
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
export const joinEvent = onCall({ cors: true }, async (request) => {
    const student = await requireActiveStudent(request);
    const studentId = request.auth!.uid;
    const eventId = request.data?.eventId as string | undefined;

    if (!eventId) {
        throw new HttpsError('invalid-argument', 'Falta el evento.');
    }

    const eventRef = admin.firestore().collection('events').doc(eventId);

    await admin.firestore().runTransaction(async (tx) => {
        const eventDoc = await tx.get(eventRef);
        if (!eventDoc.exists) {
            throw new HttpsError('not-found', 'El evento ya no está disponible.');
        }
        const event = eventDoc.data()!;
        if (event.deletedAt) {
            throw new HttpsError('not-found', 'El evento ya no está disponible.');
        }

        const participants: Array<{ studentId: string; ticketCount: number }> = event.participants || [];
        if (participants.some(p => p.studentId === studentId)) {
            return; // ya estaba apuntada -- no es un error, simplemente no hace nada más
        }

        if (typeof event.capacity === 'number' && participants.length >= event.capacity) {
            throw new HttpsError('failed-precondition', 'El evento ya está completo.');
        }

        tx.update(eventRef, {
            participants: [...participants, { studentId, ticketCount: 1 }],
            studentIds: admin.firestore.FieldValue.arrayUnion(studentId),
        });
    });

    return { studentName: student.name };
});

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as nodemailer from 'nodemailer';

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
export const checkSpecialDates = onSchedule({
    schedule: '0 9 * * *',
    timeZone: 'Europe/Madrid',
}, async (event) => {
    console.log('Checking special dates (Birthdays & Anniversaries)...');

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    try {
        const studentsSnapshot = await admin.firestore().collection('students').where('active', '==', true).get();
        const promises: Promise<any>[] = [];

        studentsSnapshot.forEach(doc => {
            const student = doc.data();
            // Alumna en la Papelera (soft-delete): active no se toca al borrar, solo deletedAt --
            // sin este filtro seguiría recibiendo emails de cumpleaños/aniversario hasta la purga.
            if (student.deletedAt) return;

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

    } catch (error) {
        console.error('Error checking special dates:', error);
    }
});

async function sendBirthdayEmail(email: string, name: string) {
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

const chunk = <T,>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
    return chunks;
};

export const purgeTrash = onSchedule({
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

            if (snapshot.empty) continue;

            for (const docsChunk of chunk(snapshot.docs, FIRESTORE_BATCH_LIMIT)) {
                const batch = admin.firestore().batch();
                docsChunk.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }

            console.log(`[purgeTrash] ${collectionName}: ${snapshot.size} documento(s) purgado(s) definitivamente.`);
            totalPurged += snapshot.size;
        } catch (error) {
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
import { v1 as firestoreAdminV1 } from '@google-cloud/firestore';

const BACKUP_SERVICE_ACCOUNT = 'firebase-adminsdk-fbsvc@xen-dance-erp.iam.gserviceaccount.com';
const BACKUP_BUCKET = 'gs://xen-dance-erp.firebasestorage.app/firestore-backups';

export const scheduledFirestoreBackup = onSchedule({
    schedule: '0 3 * * *', // Cada día a las 03:00, antes de la purga de la papelera (04:00)
    timeZone: 'Europe/Madrid',
    serviceAccount: BACKUP_SERVICE_ACCOUNT,
    retryCount: 2,
}, async () => {
    const client = new firestoreAdminV1.FirestoreAdminClient();
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

function requireAdminCaller(request: { auth?: { token: { email?: string } } | null }): string {
    const email = request.auth?.token?.email;
    if (!email || !ADMIN_EMAILS.includes(email)) {
        throw new HttpsError('permission-denied', 'Solo la administración puede gestionar accesos.');
    }
    return email;
}

// Sin caracteres ambiguos (0/O, 1/l/I) para poder dictarla o copiarla sin errores.
function generateTemporaryPassword(length = 12): string {
    const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < length; i++) password += alphabet[randomInt(alphabet.length)];
    return password;
}

/**
 * Crea, restablece o revoca la cuenta de ERP de un profesor. Solo administradores.
 * - create: crea el usuario con el email de la ficha del profesor y una contraseña temporal que se
 *   devuelve UNA vez para que la administración se la entregue.
 * - reset: genera una contraseña temporal nueva (y cierra sus sesiones abiertas).
 * - revoke: borra la cuenta; el profesor deja de poder entrar.
 */
export const manageInstructorAccount = onCall({ cors: true }, async (request) => {
    requireAdminCaller(request as any);

    const action = request.data?.action as string | undefined;
    const instructorId = (request.data?.instructorId as string | undefined)?.trim();
    if (!instructorId || !['create', 'reset', 'revoke'].includes(action || '')) {
        throw new HttpsError('invalid-argument', 'Solicitud no válida.');
    }

    const db = admin.firestore();
    const instructorRef = db.collection('instructors').doc(instructorId);
    const accountRef = db.collection('instructorAccounts').doc(instructorId);
    const [instructorSnap, accountSnap] = await Promise.all([instructorRef.get(), accountRef.get()]);

    if (!instructorSnap.exists || instructorSnap.data()?.deletedAt) {
        throw new HttpsError('not-found', 'No se encontró al profesor.');
    }
    const instructor = instructorSnap.data()!;

    if (action === 'create') {
        if (accountSnap.exists) throw new HttpsError('already-exists', 'Este profesor ya tiene acceso. Puedes restablecer su contraseña.');
        const email = String(instructor.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new HttpsError('failed-precondition', 'La ficha del profesor no tiene un email válido. Añádelo antes de crear el acceso.');
        }
        if (ADMIN_EMAILS.includes(email)) {
            throw new HttpsError('failed-precondition', 'Ese email pertenece a un administrador.');
        }

        const password = generateTemporaryPassword();
        let user: admin.auth.UserRecord;
        try {
            user = await admin.auth().createUser({ email, password, displayName: String(instructor.name || ''), emailVerified: false });
        } catch (error: any) {
            if (error?.code === 'auth/email-already-exists') {
                throw new HttpsError('already-exists', 'Ya existe una cuenta con ese email (por ejemplo, de una alumna). Usa otro email para el profesor.');
            }
            throw error;
        }

        await admin.auth().setCustomUserClaims(user.uid, { role: 'Instructor', instructorId });
        await Promise.all([
            accountRef.set({ uid: user.uid, email, createdAt: new Date().toISOString() }),
            db.collection('userProfiles').doc(user.uid).set({ uid: user.uid, email, role: 'Instructor', name: instructor.name || email.split('@')[0], instructorId }),
            instructorRef.update({ hasAccess: true }),
        ]);
        // Email de bienvenida con las credenciales. Si falla (Gmail caído, etc.) la cuenta YA está
        // creada: no se deshace, se avisa a la administración para que se las dé en persona.
        let emailSent = false;
        try {
            const welcome = buildInstructorWelcomeEmail({ name: String(instructor.name || ''), email, password });
            await transporter.sendMail({
                from: '"Xen Dance Space" <info@xendance.space>',
                to: email,
                subject: welcome.subject,
                html: welcome.html,
                text: welcome.text,
            });
            emailSent = true;
        } catch (error) {
            console.error('[manageInstructorAccount] No se pudo enviar el email de bienvenida:', error);
        }
        return { email, password, emailSent };
    }

    if (!accountSnap.exists) throw new HttpsError('failed-precondition', 'Este profesor todavía no tiene acceso.');
    const { uid, email } = accountSnap.data() as { uid: string; email: string };

    if (action === 'reset') {
        const password = generateTemporaryPassword();
        await admin.auth().updateUser(uid, { password });
        await admin.auth().revokeRefreshTokens(uid);
        return { email, password };
    }

    // revoke
    try {
        await admin.auth().deleteUser(uid);
    } catch (error: any) {
        if (error?.code !== 'auth/user-not-found') throw error;
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
async function requireInstructor(request: { auth?: { uid: string; token: Record<string, any> } | null }) {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    const instructorId = request.auth.token.instructorId as string | undefined;
    if (request.auth.token.role !== 'Instructor' || !instructorId) {
        throw new HttpsError('permission-denied', 'Tu cuenta no tiene acceso de profesor.');
    }
    const db = admin.firestore();
    const [accountSnap, instructorSnap] = await Promise.all([
        db.collection('instructorAccounts').doc(instructorId).get(),
        db.collection('instructors').doc(instructorId).get(),
    ]);
    const instructor = instructorSnap.data();
    if (!accountSnap.exists || accountSnap.data()?.uid !== request.auth.uid
        || !instructorSnap.exists || !instructor || instructor.deletedAt || instructor.active === false) {
        throw new HttpsError('permission-denied', 'Tu acceso ya no está activo. Contacta con la administración.');
    }
    return { instructorId, instructor, email: request.auth.token.email as string | undefined };
}

async function getInstructorClassIds(instructorId: string) {
    // Una clase puede llevarla como profesor principal (instructorId) o como profesor de uno de sus
    // grupos (instructorIds); se juntan las dos consultas sin duplicar.
    const col = admin.firestore().collection('classes');
    const [primary, grouped] = await Promise.all([
        col.where('instructorId', '==', instructorId).get(),
        col.where('instructorIds', 'array-contains', instructorId).get(),
    ]);
    const byId = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    [...primary.docs, ...grouped.docs].forEach(d => { if (!d.data().deletedAt) byId.set(d.id, d); });
    const docs = [...byId.values()];
    return { docs, ids: docs.map(d => d.id) };
}

/**
 * Todo lo que necesita el panel del profesor, solo de SUS clases: clases, alumnas activas (datos
 * mínimos), asistencia de los últimos ~13 meses y avisos de ausencia próximos.
 */
export const teacherOverview = onCall({ cors: true }, async (request) => {
    const { instructorId, instructor } = await requireInstructor(request as any);
    const db = admin.firestore();
    const today = getMadridNow(new Date()).dateIso;
    const since = new Date(Date.parse(today + 'T00:00:00Z') - 400 * 86400000).toISOString().slice(0, 10);

    const { docs: classDocs, ids: classIds } = await getInstructorClassIds(instructorId);
    const classes = classDocs.map(d => toTeacherClass(d.data(), d.id, instructorId));
    // classId -> grupos que lleva este profesor (null = ve toda la clase)
    const scopeByClass = new Map<string, string[] | null>(classDocs.map(d => [d.id, teacherGroupScope(d.data(), instructorId)]));

    const students: TeacherStudentView[] = [];
    const attendance: Array<{ id: string; classId: string; date: string; presentStudentIds: string[]; notes?: string; myNotes?: string }> = [];
    const absences: Array<{ id: string; classId: string; studentId: string; studentName: string; date: string }> = [];

    if (classIds.length > 0) {
        const seen = new Set<string>();
        await Promise.all(chunkArray(classIds, 10).map(async (ids) => {
            const [studentsSnap, attendanceSnap, absencesSnap] = await Promise.all([
                db.collection('students').where('enrolledClassIds', 'array-contains-any', ids).get(),
                db.collection('attendance').where('classId', 'in', ids).get(),
                db.collection('classAbsences').where('classId', 'in', ids).get(),
            ]);
            studentsSnap.docs.forEach(d => {
                if (seen.has(d.id)) return;
                const view = toTeacherStudent(d.data(), d.id, scopeByClass);
                if (view) { seen.add(d.id); students.push(view); }
            });
            attendanceSnap.docs.forEach(d => {
                const r = d.data();
                if (typeof r.date === 'string' && r.date >= since) {
                    // Con varios profesores cada uno ve sus propias notas; si no, las de la clase.
                    const myNotes = r.notesByInstructor ? (r.notesByInstructor[instructorId]?.text ?? '') : (r.notes ?? '');
                    attendance.push({ id: d.id, classId: r.classId, date: r.date, presentStudentIds: r.presentStudentIds || [], notes: r.notes, myNotes });
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

    // En las clases con grupos solo cuentan las alumnas de su grupo (asistencia y avisos de ausencia).
    const visibleIds = new Set(students.map(s => s.id));
    attendance.forEach(r => {
        if (scopeByClass.get(r.classId) !== null && scopeByClass.has(r.classId)) {
            r.presentStudentIds = r.presentStudentIds.filter(id => visibleIds.has(id));
        }
    });
    const visibleAbsences = absences.filter(a => !(scopeByClass.get(a.classId) !== null && scopeByClass.has(a.classId)) || visibleIds.has(a.studentId));

    // Próximos eventos del ERP (sin precios ni notas), con cuáles de SUS alumnas están apuntadas.
    const studentNames = new Map(students.map(s => [s.id, s.name]));
    const eventsSnap = await db.collection('events').where('date', '>=', today).get();
    const events: TeacherEventView[] = eventsSnap.docs
        .map(d => toTeacherEvent(d.data(), d.id, today, studentNames))
        .filter((e): e is TeacherEventView => e !== null)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    return {
        today,
        instructor: { id: instructorId, name: String(instructor.name || '') },
        classes,
        students,
        attendance,
        absences: visibleAbsences,
        events,
    };
});

/**
 * El profesor pasa lista de una de SUS clases. Se valida la clase, la fecha (hoy o hasta 60 días
 * atrás) y que todas las asistentes estén inscritas en esa clase; crea o actualiza el registro de
 * ese día y avisa a la administración como ya hace la asistencia registrada por un Admin.
 */
export const teacherSaveAttendance = onCall({ cors: true }, async (request) => {
    const { instructorId, instructor, email } = await requireInstructor(request as any);
    const db = admin.firestore();

    const validation = validateAttendanceInput(request.data, getMadridNow(new Date()).dateIso);
    if (validation.ok === false) throw new HttpsError('invalid-argument', validation.message);
    const { classId, date, presentStudentIds, notes } = validation.value;

    const classSnap = await db.collection('classes').doc(classId).get();
    const danceClass = classSnap.data();
    if (!classSnap.exists || !danceClass || danceClass.deletedAt || !classInstructorIds(danceClass).includes(instructorId)) {
        throw new HttpsError('permission-denied', 'Esa clase no es tuya.');
    }

    // Solo puede marcar a las alumnas de SU grupo (o a todas si la clase no tiene grupos / no tiene
    // grupo asignado la alumna).
    const scope = teacherGroupScope(danceClass, instructorId);
    const enrolledSnap = await db.collection('students').where('enrolledClassIds', 'array-contains', classId).get();
    const eligibleIds = new Set(enrolledSnap.docs
        .filter(d => !d.data().deletedAt && isStudentInScope(d.data(), classId, scope))
        .map(d => d.id));
    if (presentStudentIds.some(id => !eligibleIds.has(id))) {
        throw new HttpsError('invalid-argument', 'Hay alumnas que no están inscritas en tu grupo de esta clase.');
    }

    const existing = await db.collection('attendance').where('classId', '==', classId).where('date', '==', date).limit(1).get();
    const existingData = existing.empty ? null : existing.docs[0].data();

    // Clase con varios profesores: se conserva lo que marcaron los demás y las notas de cada uno.
    const shared = classInstructorIds(danceClass).length > 1;
    let finalPresent = presentStudentIds;
    let finalNotes = notes;
    let notesByInstructor: Record<string, NoteEntry> | undefined;
    if (shared) {
        finalPresent = mergePresent(existingData?.presentStudentIds || [], eligibleIds, presentStudentIds);
        const byInstructor: Record<string, NoteEntry> = { ...(existingData?.notesByInstructor || {}) };
        if (!existingData?.notesByInstructor && existingData?.notes) byInstructor._admin = { name: 'Notas', text: existingData.notes };
        byInstructor[instructorId] = { name: String(instructor.name || 'Profesor'), text: notes };
        notesByInstructor = byInstructor;
        finalNotes = composeNotes(byInstructor);
    }

    const record: Record<string, unknown> = { classId, date, presentStudentIds: finalPresent, notes: finalNotes, recordedByInstructorId: instructorId };
    if (notesByInstructor) record.notesByInstructor = notesByInstructor;
    let attendanceId: string;
    if (existing.empty) {
        attendanceId = (await db.collection('attendance').add(record)).id;
    } else {
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
export const sendClassReminders = onSchedule({
    schedule: '*/15 * * * *',
    timeZone: 'Europe/Madrid',
    retryCount: 0,
}, async () => {
    const db = admin.firestore();
    const now = getMadridNow(new Date());

    const classesSnap = await db.collection('classes').get();
    const dueClasses = classesDueNow(
        classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ReminderClass)),
        now
    );
    if (dueClasses.length === 0) return;

    // Profesores por id, para nombrar en el aviso al de SU grupo.
    const instructorNames = new Map<string, string>();
    (await db.collection('instructors').get()).docs.forEach(d => instructorNames.set(d.id, String(d.data().name || '')));

    // Una alumna puede tener varias clases a la misma hora: se junta todo y se manda UN solo aviso por
    // alumna (antes salía un push por clase y llegaban varios de golpe).
    const remindersByStudent = new Map<string, ReminderItem[]>();

    for (const danceClass of dueClasses) {
        try {
            try {
                await db.collection('classReminderLog').doc(`${now.dateIso}_${danceClass.id}`).create({
                    sentAt: new Date().toISOString(),
                    className: danceClass.name,
                });
            } catch (error: any) {
                if (error?.code === 6) continue; // ALREADY_EXISTS: ya se avisó de esta sesión
                throw error;
            }

            const [studentsSnap, absencesSnap] = await Promise.all([
                db.collection('students').where('enrolledClassIds', 'array-contains', danceClass.id).get(),
                db.collection('classAbsences').where('classId', '==', danceClass.id).where('date', '==', now.dateIso).get(),
            ]);

            const absentIds = new Set(absencesSnap.docs.map(d => d.data().studentId as string));
            const rawClass = classesSnap.docs.find(c => c.id === danceClass.id)?.data() || {};
            const recipients = studentsSnap.docs.filter(d => {
                const s = d.data();
                return s.active && !s.deletedAt && !absentIds.has(d.id);
            });

            recipients.forEach(d => {
                const names = studentInstructorIds(rawClass, danceClass.id, d.data())
                    .map(id => instructorNames.get(id))
                    .filter((n): n is string => !!n);
                const list = remindersByStudent.get(d.id) || [];
                list.push({ className: danceClass.name, startTime: danceClass.startTime, instructorName: names.length > 0 ? names.join(' y ') : undefined });
                remindersByStudent.set(d.id, list);
            });

            console.log(`[sendClassReminders] ${danceClass.name} (${now.dateIso}, aviso ${REMINDER_LEAD_MINUTES} min antes): ${recipients.length} alumna(s) avisada(s), ${absentIds.size} ausencia(s) avisada(s).`);
        } catch (error) {
            // Una clase que falla no debe impedir los avisos de las demás.
            console.error(`[sendClassReminders] Error con la clase ${danceClass.id}:`, error);
        }
    }

    await Promise.all([...remindersByStudent.entries()].map(([studentId, items]) => {
        const message = buildReminderMessage(items);
        return sendPushToStudent(studentId, { ...message, url: '/portal', tag: 'class-reminder' });
    }));
    console.log(`[sendClassReminders] ${remindersByStudent.size} alumna(s) avisada(s) de ${dueClasses.length} clase(s).`);
});

async function sendAnniversaryEmail(email: string, name: string, years: number) {
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
