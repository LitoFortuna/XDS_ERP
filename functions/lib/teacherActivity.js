"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clampPageSize = exports.matchesActivityFilters = exports.describeAttendance = exports.shouldLogAccess = exports.isSuperAdminEmail = exports.isTeacherActivityType = exports.ACTIVITY_RETENTION_DAYS = exports.ACCESS_LOG_INTERVAL_MINUTES = exports.ACTIVITY_TYPES = exports.SUPERADMIN_EMAILS = void 0;
const classReminders_1 = require("./classReminders");
// Registro histórico de la actividad de los profesores en el ERP (solo lo lee el SuperAdmin).
// Lógica pura, probada desde el vitest de la raíz (src/utils/teacherActivity.test.ts).
/** Quién puede ver el registro. Mismo SuperAdmin que userProfileService.ts. */
exports.SUPERADMIN_EMAILS = ['raulfdz3@gmail.com'];
exports.ACTIVITY_TYPES = [
    'access', 'attendance_saved', 'attendance_updated', 'password_changed', 'account_created', 'account_reset', 'account_revoked',
];
/** Un acceso solo se registra si el anterior fue hace más de esto: abrir y cerrar la app no llena el registro. */
exports.ACCESS_LOG_INTERVAL_MINUTES = 30;
/** Cuántos días se conserva el registro. */
exports.ACTIVITY_RETENTION_DAYS = 400;
const isTeacherActivityType = (value) => typeof value === 'string' && exports.ACTIVITY_TYPES.includes(value);
exports.isTeacherActivityType = isTeacherActivityType;
const isSuperAdminEmail = (email) => !!email && exports.SUPERADMIN_EMAILS.includes(email);
exports.isSuperAdminEmail = isSuperAdminEmail;
const shouldLogAccess = (lastAccessIso, now, intervalMinutes = exports.ACCESS_LOG_INTERVAL_MINUTES) => {
    if (!lastAccessIso)
        return true;
    const last = Date.parse(lastAccessIso);
    if (isNaN(last))
        return true;
    return now.getTime() - last >= intervalMinutes * 60000;
};
exports.shouldLogAccess = shouldLogAccess;
const formatDateEs = (iso) => iso.split('-').reverse().join('/');
const describeAttendance = (className, dateIso, present, enrolled, updated) => `${updated ? 'Corrigió' : 'Pasó'} lista de «${className}» del ${formatDateEs(dateIso)}: ${present} ${present === 1 ? 'presente' : 'presentes'} de ${enrolled}`;
exports.describeAttendance = describeAttendance;
// ¿Cumple la entrada los filtros? Las fechas se comparan por día en hora de Madrid, no en UTC.
const matchesActivityFilters = (entry, filters) => {
    if (filters.instructorId && entry.instructorId !== filters.instructorId)
        return false;
    if (filters.type && entry.type !== filters.type)
        return false;
    if (filters.from || filters.to) {
        const day = (0, classReminders_1.getMadridNow)(new Date(entry.createdAt)).dateIso;
        if (filters.from && day < filters.from)
            return false;
        if (filters.to && day > filters.to)
            return false;
    }
    return true;
};
exports.matchesActivityFilters = matchesActivityFilters;
const clampPageSize = (value, fallback = 50, max = 200) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), max) : fallback;
};
exports.clampPageSize = clampPageSize;
//# sourceMappingURL=teacherActivity.js.map