import { getMadridNow } from './classReminders';

// Registro histórico de la actividad de los profesores en el ERP (solo lo lee el SuperAdmin).
// Lógica pura, probada desde el vitest de la raíz (src/utils/teacherActivity.test.ts).

/** Quién puede ver el registro. Mismo SuperAdmin que userProfileService.ts. */
export const SUPERADMIN_EMAILS = ['raulfdz3@gmail.com'];

// Xenia (dirección) entra al ERP completo con la cuenta de administración, no al panel de profesor; su
// actividad se registra igualmente en este historial con un id propio.
export const DIRECTOR_EMAIL = 'info@xendance.space';
export const DIRECTOR_ACTIVITY_ID = 'director';
export const DIRECTOR_NAME = 'Xenia (dirección)';

export type TeacherActivityType =
    | 'access'              // el profesor entra al panel
    | 'attendance_saved'    // pasa lista por primera vez de una clase y día
    | 'attendance_updated'  // corrige una lista ya pasada
    | 'password_changed'    // cambia su contraseña
    | 'account_created'     // la administración le crea el acceso
    | 'account_reset'       // la administración restablece su contraseña
    | 'account_revoked'     // la administración le quita el acceso
    | 'admin_action';       // acción de la dirección en el ERP completo (cobros, gastos…)

export const ACTIVITY_TYPES: TeacherActivityType[] = [
    'access', 'attendance_saved', 'attendance_updated', 'password_changed', 'account_created', 'account_reset', 'account_revoked', 'admin_action',
];

/** Un acceso solo se registra si el anterior fue hace más de esto: abrir y cerrar la app no llena el registro. */
export const ACCESS_LOG_INTERVAL_MINUTES = 30;
/** Cuántos días se conserva el registro. */
export const ACTIVITY_RETENTION_DAYS = 400;

export interface TeacherActivityEntry {
    id?: string;
    instructorId: string;
    instructorName: string;
    type: TeacherActivityType;
    description: string;
    details?: Record<string, string | number>;
    actorEmail?: string; // quién lo hizo si no fue el propio profesor (administración)
    createdAt: string; // ISO
}

export const isTeacherActivityType = (value: unknown): value is TeacherActivityType =>
    typeof value === 'string' && (ACTIVITY_TYPES as string[]).includes(value);

export const isSuperAdminEmail = (email: string | undefined | null): boolean =>
    !!email && SUPERADMIN_EMAILS.includes(email);

export const shouldLogAccess = (lastAccessIso: string | undefined, now: Date, intervalMinutes: number = ACCESS_LOG_INTERVAL_MINUTES): boolean => {
    if (!lastAccessIso) return true;
    const last = Date.parse(lastAccessIso);
    if (isNaN(last)) return true;
    return now.getTime() - last >= intervalMinutes * 60000;
};

// La asistencia de la dirección llega por activityLogs (lleva clase, día y presentes) y se copia aquí como
// 'Lista pasada'. Cobros, gastos y el resto de acciones se anotan en origen (logAdminAction), así que las
// demás anotaciones de activityLogs se ignoran para no duplicarlas. null = no copiar.
export const mapAdminActivityType = (activityType: unknown): TeacherActivityType | null =>
    activityType === 'attendance' ? 'attendance_saved' : null;

// Acciones de gestión de la dirección que acepta logAdminAction: lista cerrada y descripción acotada.
export const ADMIN_ACTION_KINDS = [
    'student_added', 'student_updated', 'student_deleted', 'student_restored', 'student_purged', 'students_imported',
    'instructor_added', 'instructor_updated', 'instructor_deleted', 'instructor_restored', 'instructor_purged',
    'class_added', 'class_updated', 'class_deleted', 'class_restored', 'class_purged',
    'event_added', 'event_updated', 'event_deleted', 'event_restored', 'event_purged',
    'nuptial_added', 'nuptial_updated', 'nuptial_deleted', 'nuptial_restored', 'nuptial_purged',
    'merch_item_added', 'merch_item_updated', 'merch_item_deleted', 'merch_sale_added', 'merch_sale_cancelled',
    'payment_added', 'payment_updated', 'payment_deleted', 'payment_restored', 'payment_purged', 'payments_imported',
    'cost_added', 'cost_updated', 'cost_deleted', 'cost_restored', 'cost_purged', 'costs_imported',
] as const;
export type AdminActionKind = typeof ADMIN_ACTION_KINDS[number];

export const MAX_ADMIN_DESCRIPTION = 300;

// Valida lo que envía el navegador de la dirección: tipo de la lista cerrada y descripción de texto sin
// caracteres de control, recortada. Devuelve null si no es válido.
export const sanitizeAdminAction = (data: any): { kind: AdminActionKind; description: string } | null => {
    const kind = data?.kind;
    if (typeof kind !== 'string' || !(ADMIN_ACTION_KINDS as readonly string[]).includes(kind)) return null;
    const description = typeof data?.description === 'string'
        ? data.description.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_ADMIN_DESCRIPTION)
        : '';
    return description ? { kind: kind as AdminActionKind, description } : null;
};

export const isDirectorEmail = (email: unknown): boolean => email === DIRECTOR_EMAIL;

const formatDateEs = (iso: string): string => iso.split('-').reverse().join('/');

export const describeAttendance = (className: string, dateIso: string, present: number, enrolled: number, updated: boolean): string =>
    `${updated ? 'Corrigió' : 'Pasó'} lista de «${className}» del ${formatDateEs(dateIso)}: ${present} ${present === 1 ? 'presente' : 'presentes'} de ${enrolled}`;

export interface ActivityFilters {
    instructorId?: string;
    type?: string;
    from?: string; // YYYY-MM-DD, día en Madrid, incluido
    to?: string;   // YYYY-MM-DD, día en Madrid, incluido
}

// ¿Cumple la entrada los filtros? Las fechas se comparan por día en hora de Madrid, no en UTC.
export const matchesActivityFilters = (entry: TeacherActivityEntry, filters: ActivityFilters): boolean => {
    if (filters.instructorId && entry.instructorId !== filters.instructorId) return false;
    if (filters.type && entry.type !== filters.type) return false;
    if (filters.from || filters.to) {
        const day = getMadridNow(new Date(entry.createdAt)).dateIso;
        if (filters.from && day < filters.from) return false;
        if (filters.to && day > filters.to) return false;
    }
    return true;
};

export const clampPageSize = (value: unknown, fallback = 50, max = 200): number => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), max) : fallback;
};
