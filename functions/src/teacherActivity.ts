import { getMadridNow } from './classReminders';

// Registro histórico de la actividad de los profesores en el ERP (solo lo lee el SuperAdmin).
// Lógica pura, probada desde el vitest de la raíz (src/utils/teacherActivity.test.ts).

/** Quién puede ver el registro. Mismo SuperAdmin que userProfileService.ts. */
export const SUPERADMIN_EMAILS = ['raulfdz3@gmail.com'];

export type TeacherActivityType =
    | 'access'              // el profesor entra al panel
    | 'attendance_saved'    // pasa lista por primera vez de una clase y día
    | 'attendance_updated'  // corrige una lista ya pasada
    | 'password_changed'    // cambia su contraseña
    | 'account_created'     // la administración le crea el acceso
    | 'account_reset'       // la administración restablece su contraseña
    | 'account_revoked';    // la administración le quita el acceso

export const ACTIVITY_TYPES: TeacherActivityType[] = [
    'access', 'attendance_saved', 'attendance_updated', 'password_changed', 'account_created', 'account_reset', 'account_revoked',
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
