// Lógica pura (sin Firebase) del acceso de profesores al ERP, separada de index.ts para poder
// probarla desde el vitest de la raíz (src/utils/teacherData.test.ts).
//
// Modelo de seguridad: un profesor NO lee Firestore directamente (las reglas siguen cerradas para
// alumnas, pagos, etc.). Todo lo suyo pasa por las Cloud Functions teacherOverview y
// teacherSaveAttendance, que usan estas funciones para devolver solo lo mínimo de SUS clases.

/** Mismos administradores que firestore.rules (isAdmin) y userProfileService.ts. */
export const ADMIN_EMAILS = ['raulfdz3@gmail.com', 'info@xendance.space'];

export const chunk = <T,>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
    return chunks;
};

export interface TeacherStudentView {
    id: string;
    name: string;
    birthDate?: string;
    enrollmentDate?: string;
    active: boolean;
    /** Solo las clases de este profesor en las que está inscrita. */
    enrolledClassIds: string[];
}

// Vista reducida de una alumna para un profesor: sin teléfono, email, cuotas, notas ni método de
// pago. Devuelve null si no es una alumna activa de alguna de sus clases.
export const toTeacherStudent = (raw: Record<string, any>, id: string, teacherClassIds: Set<string>): TeacherStudentView | null => {
    if (!raw || raw.deletedAt || raw.active === false) return null;
    const enrolled: string[] = Array.isArray(raw.enrolledClassIds)
        ? raw.enrolledClassIds.filter((c: unknown) => typeof c === 'string' && teacherClassIds.has(c))
        : [];
    if (enrolled.length === 0) return null;
    return {
        id,
        name: String(raw.name || ''),
        birthDate: typeof raw.birthDate === 'string' ? raw.birthDate : undefined,
        enrollmentDate: typeof raw.enrollmentDate === 'string' ? raw.enrollmentDate : undefined,
        active: true,
        enrolledClassIds: enrolled,
    };
};

export interface TeacherClassView {
    id: string;
    name: string;
    category: string;
    days: string[];
    startTime: string;
    endTime: string;
    capacity: number;
}

// Sin tarifas (baseRate) ni nada económico.
export const toTeacherClass = (raw: Record<string, any>, id: string): TeacherClassView => ({
    id,
    name: String(raw.name || ''),
    category: String(raw.category || ''),
    days: Array.isArray(raw.days) ? raw.days.map(String) : [],
    startTime: String(raw.startTime || ''),
    endTime: String(raw.endTime || ''),
    capacity: Number(raw.capacity) || 0,
});

export const MAX_BACKDATE_DAYS = 60;

const isRealIsoDate = (value: string): boolean => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return d.getUTCFullYear() === Number(match[1]) && d.getUTCMonth() === Number(match[2]) - 1 && d.getUTCDate() === Number(match[3]);
};

const daysBetween = (fromIso: string, toIso: string): number =>
    Math.round((Date.parse(toIso + 'T00:00:00Z') - Date.parse(fromIso + 'T00:00:00Z')) / 86400000);

export interface AttendanceInput {
    classId: string;
    date: string;
    presentStudentIds: string[];
    notes: string;
}

export type AttendanceValidation = { ok: true; value: AttendanceInput } | { ok: false; message: string };

// Valida lo que envía el profesor. No se puede pasar lista de días futuros ni de hace más de 60
// días (las correcciones antiguas las hace la administración).
export const validateAttendanceInput = (input: any, todayIso: string): AttendanceValidation => {
    const classId = typeof input?.classId === 'string' ? input.classId.trim() : '';
    if (!classId) return { ok: false, message: 'Falta la clase.' };

    const date = typeof input?.date === 'string' ? input.date : '';
    if (!isRealIsoDate(date)) return { ok: false, message: 'La fecha no es válida.' };
    const age = daysBetween(date, todayIso);
    if (age < 0) return { ok: false, message: 'No se puede pasar lista de un día futuro.' };
    if (age > MAX_BACKDATE_DAYS) return { ok: false, message: `Solo se puede pasar lista de los últimos ${MAX_BACKDATE_DAYS} días. Para fechas anteriores contacta con administración.` };

    if (!Array.isArray(input?.presentStudentIds) || input.presentStudentIds.some((s: unknown) => typeof s !== 'string' || !s)) {
        return { ok: false, message: 'La lista de asistentes no es válida.' };
    }
    const presentStudentIds = [...new Set<string>(input.presentStudentIds)];
    if (presentStudentIds.length > 500) return { ok: false, message: 'Demasiados asistentes.' };

    const notes = typeof input?.notes === 'string' ? input.notes.trim().slice(0, 500) : '';
    return { ok: true, value: { classId, date, presentStudentIds, notes } };
};

export interface TeacherEventView {
    id: string;
    name: string;
    type: string;
    date: string; // YYYY-MM-DD
    time: string;
    location: string;
    capacity?: number;
    /** Total de inscritas (de todas las clases) y cuáles son alumnas de este profesor. */
    enrolledCount: number;
    myStudents: string[]; // nombres
}

// Vista de un evento para un profesor: sin precio, notas internas ni ids de otras alumnas.
// Devuelve null si el evento está borrado, no tiene fecha válida o ya pasó.
export const toTeacherEvent = (
    raw: Record<string, any>,
    id: string,
    todayIso: string,
    teacherStudentNames: Map<string, string>
): TeacherEventView | null => {
    if (!raw || raw.deletedAt || typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date) || raw.date < todayIso) return null;
    const ids = new Set<string>([
        ...(Array.isArray(raw.studentIds) ? raw.studentIds : []),
        ...(Array.isArray(raw.participants) ? raw.participants.map((p: any) => p?.studentId) : []),
    ].filter((s): s is string => typeof s === 'string'));
    return {
        id,
        name: String(raw.name || ''),
        type: String(raw.type || ''),
        date: raw.date,
        time: typeof raw.time === 'string' ? raw.time : '',
        location: String(raw.location || ''),
        capacity: typeof raw.capacity === 'number' ? raw.capacity : undefined,
        enrolledCount: ids.size,
        myStudents: [...ids].map(s => teacherStudentNames.get(s)).filter((n): n is string => !!n).sort((a, b) => a.localeCompare(b, 'es')),
    };
};
