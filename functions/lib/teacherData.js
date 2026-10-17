"use strict";
// Lógica pura (sin Firebase) del acceso de profesores al ERP, separada de index.ts para poder
// probarla desde el vitest de la raíz (src/utils/teacherData.test.ts).
//
// Modelo de seguridad: un profesor NO lee Firestore directamente (las reglas siguen cerradas para
// alumnas, pagos, etc.). Todo lo suyo pasa por las Cloud Functions teacherOverview y
// teacherSaveAttendance, que usan estas funciones para devolver solo lo mínimo de SUS clases.
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAttendanceInput = exports.MAX_BACKDATE_DAYS = exports.toTeacherClass = exports.toTeacherStudent = exports.chunk = exports.ADMIN_EMAILS = void 0;
/** Mismos administradores que firestore.rules (isAdmin) y userProfileService.ts. */
exports.ADMIN_EMAILS = ['raulfdz3@gmail.com', 'info@xendance.space'];
const chunk = (items, size) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += size)
        chunks.push(items.slice(i, i + size));
    return chunks;
};
exports.chunk = chunk;
// Vista reducida de una alumna para un profesor: sin teléfono, email, cuotas, notas ni método de
// pago. Devuelve null si no es una alumna activa de alguna de sus clases.
const toTeacherStudent = (raw, id, teacherClassIds) => {
    if (!raw || raw.deletedAt || raw.active === false)
        return null;
    const enrolled = Array.isArray(raw.enrolledClassIds)
        ? raw.enrolledClassIds.filter((c) => typeof c === 'string' && teacherClassIds.has(c))
        : [];
    if (enrolled.length === 0)
        return null;
    return {
        id,
        name: String(raw.name || ''),
        birthDate: typeof raw.birthDate === 'string' ? raw.birthDate : undefined,
        enrollmentDate: typeof raw.enrollmentDate === 'string' ? raw.enrollmentDate : undefined,
        active: true,
        enrolledClassIds: enrolled,
    };
};
exports.toTeacherStudent = toTeacherStudent;
// Sin tarifas (baseRate) ni nada económico.
const toTeacherClass = (raw, id) => ({
    id,
    name: String(raw.name || ''),
    category: String(raw.category || ''),
    days: Array.isArray(raw.days) ? raw.days.map(String) : [],
    startTime: String(raw.startTime || ''),
    endTime: String(raw.endTime || ''),
    capacity: Number(raw.capacity) || 0,
});
exports.toTeacherClass = toTeacherClass;
exports.MAX_BACKDATE_DAYS = 60;
const isRealIsoDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match)
        return false;
    const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return d.getUTCFullYear() === Number(match[1]) && d.getUTCMonth() === Number(match[2]) - 1 && d.getUTCDate() === Number(match[3]);
};
const daysBetween = (fromIso, toIso) => Math.round((Date.parse(toIso + 'T00:00:00Z') - Date.parse(fromIso + 'T00:00:00Z')) / 86400000);
// Valida lo que envía el profesor. No se puede pasar lista de días futuros ni de hace más de 60
// días (las correcciones antiguas las hace la administración).
const validateAttendanceInput = (input, todayIso) => {
    const classId = typeof (input === null || input === void 0 ? void 0 : input.classId) === 'string' ? input.classId.trim() : '';
    if (!classId)
        return { ok: false, message: 'Falta la clase.' };
    const date = typeof (input === null || input === void 0 ? void 0 : input.date) === 'string' ? input.date : '';
    if (!isRealIsoDate(date))
        return { ok: false, message: 'La fecha no es válida.' };
    const age = daysBetween(date, todayIso);
    if (age < 0)
        return { ok: false, message: 'No se puede pasar lista de un día futuro.' };
    if (age > exports.MAX_BACKDATE_DAYS)
        return { ok: false, message: `Solo se puede pasar lista de los últimos ${exports.MAX_BACKDATE_DAYS} días. Para fechas anteriores contacta con administración.` };
    if (!Array.isArray(input === null || input === void 0 ? void 0 : input.presentStudentIds) || input.presentStudentIds.some((s) => typeof s !== 'string' || !s)) {
        return { ok: false, message: 'La lista de asistentes no es válida.' };
    }
    const presentStudentIds = [...new Set(input.presentStudentIds)];
    if (presentStudentIds.length > 500)
        return { ok: false, message: 'Demasiados asistentes.' };
    const notes = typeof (input === null || input === void 0 ? void 0 : input.notes) === 'string' ? input.notes.trim().slice(0, 500) : '';
    return { ok: true, value: { classId, date, presentStudentIds, notes } };
};
exports.validateAttendanceInput = validateAttendanceInput;
//# sourceMappingURL=teacherData.js.map