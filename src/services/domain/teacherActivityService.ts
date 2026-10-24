import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

export type TeacherActivityType =
    | 'access' | 'attendance_saved' | 'attendance_updated' | 'password_changed'
    | 'account_created' | 'account_reset' | 'account_revoked' | 'admin_action';

export interface TeacherActivityEntry {
    id: string;
    instructorId: string;
    instructorName: string;
    type: TeacherActivityType;
    description: string;
    details?: Record<string, string | number>;
    actorEmail?: string; // quién lo hizo si fue la administración
    createdAt: string; // ISO
}

export interface TeacherActivitySummary {
    instructorId: string;
    name: string;
    email: string;
    lastAccessAt: string | null;
    createdAt: string | null;
}

export interface TeacherActivityFilters {
    instructorId?: string;
    type?: TeacherActivityType | '';
    from?: string; // YYYY-MM-DD
    to?: string;   // YYYY-MM-DD
}

export interface TeacherActivityPage {
    entries: TeacherActivityEntry[];
    hasMore: boolean;
    nextBefore: string | null;
    teachers?: TeacherActivitySummary[]; // solo en la primera página
}

// Solo el SuperAdmin (lo comprueba el servidor).
export const fetchTeacherActivity = async (
    filters: TeacherActivityFilters,
    before?: string | null,
    limit = 50
): Promise<TeacherActivityPage> => {
    const callable = httpsCallable<Record<string, unknown>, TeacherActivityPage>(functions, 'listTeacherActivity');
    return (await callable({ ...filters, before: before || undefined, limit })).data;
};

// La dirección (Xenia) avisa de que ha abierto el ERP; el servidor ignora a cualquier otra cuenta y
// solo anota el acceso si el anterior fue hace más de 30 minutos. Best-effort: nunca debe molestar.
export const pingAdminAccess = async (): Promise<void> => {
    try {
        await httpsCallable(functions, 'adminAccessPing')();
    } catch (error) {
        console.error('[teacherActivity] No se pudo registrar el acceso:', error);
    }
};

// Aviso best-effort de una acción que solo ocurre en el navegador del profesor (cambio de contraseña).
export const logTeacherEvent = async (type: 'password_changed'): Promise<void> => {
    try {
        await httpsCallable(functions, 'teacherLogEvent')({ type });
    } catch (error) {
        console.error('[teacherActivity] No se pudo registrar el evento:', error);
    }
};
