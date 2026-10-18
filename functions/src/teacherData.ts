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

// Todos los profesores de una clase: el principal, instructorIds y los de cada grupo.
export const classInstructorIds = (raw: Record<string, any>): string[] => {
    const groups: any[] = Array.isArray(raw?.groups) ? raw.groups : [];
    const ids = [
        raw?.instructorId,
        ...(Array.isArray(raw?.instructorIds) ? raw.instructorIds : []),
        ...groups.flatMap(g => (Array.isArray(g?.instructorIds) ? g.instructorIds : [])),
    ].filter((id): id is string => typeof id === 'string' && id.length > 0);
    return [...new Set(ids)];
};

// Grupos de la clase que lleva este profesor. null = no ve por grupos (la clase no tiene grupos, o
// él figura como principal sin estar en ninguno): ve a todas las alumnas de la clase.
export const teacherGroupScope = (raw: Record<string, any>, instructorId: string): string[] | null => {
    const groups: any[] = Array.isArray(raw?.groups) ? raw.groups : [];
    if (groups.length === 0) return null;
    const mine = groups.filter(g => Array.isArray(g?.instructorIds) && g.instructorIds.includes(instructorId)).map(g => String(g.id));
    return mine.length > 0 ? mine : null;
};

// ¿Entra la alumna en lo que ve el profesor de esta clase? Quien no tiene grupo asignado lo ven
// todos los profesores de la clase, para que nadie quede sin lista.
export const isStudentInScope = (rawStudent: Record<string, any>, classId: string, scope: string[] | null): boolean => {
    if (scope === null) return true;
    const groupId = rawStudent?.classGroups?.[classId];
    return !groupId || scope.includes(String(groupId));
};

// Vista reducida de una alumna para un profesor: sin teléfono, email, cuotas, notas ni método de
// pago. `scopeByClass` tiene SUS clases (classId -> grupos que lleva, o null si ve toda la clase).
// Devuelve null si no es una alumna activa de alguna de sus clases/grupos.
export const toTeacherStudent = (raw: Record<string, any>, id: string, scopeByClass: Map<string, string[] | null>): TeacherStudentView | null => {
    if (!raw || raw.deletedAt || raw.active === false) return null;
    const enrolled: string[] = Array.isArray(raw.enrolledClassIds)
        ? raw.enrolledClassIds.filter((c: unknown) => typeof c === 'string' && scopeByClass.has(c) && isStudentInScope(raw, c, scopeByClass.get(c)!))
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
    /** Nombre(s) del/los grupo(s) que lleva este profesor en la clase, si la clase tiene grupos. */
    groupName?: string;
}

// Sin tarifas (baseRate) ni nada económico.
export const toTeacherClass = (raw: Record<string, any>, id: string, instructorId?: string): TeacherClassView => ({
    id,
    name: String(raw.name || ''),
    category: String(raw.category || ''),
    days: Array.isArray(raw.days) ? raw.days.map(String) : [],
    startTime: String(raw.startTime || ''),
    endTime: String(raw.endTime || ''),
    capacity: Number(raw.capacity) || 0,
    groupName: (() => {
        const scope = instructorId ? teacherGroupScope(raw, instructorId) : null;
        if (!scope) return undefined;
        const names = (raw.groups as any[]).filter(g => scope.includes(String(g.id))).map(g => String(g.name || '')).filter(Boolean);
        return names.length > 0 ? names.join(' + ') : undefined;
    })(),
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

export interface NoteEntry { name: string; text: string }

// Notas de una clase con varios profesores: cada uno escribe las suyas (notesByInstructor) y el
// campo `notes` que ve la administración las reúne como "Pablo: …  ·  Vic: …".
export const composeNotes = (byInstructor: Record<string, NoteEntry>): string =>
    Object.values(byInstructor)
        .filter(e => e && e.text && e.text.trim())
        .map(e => `${e.name}: ${e.text.trim()}`)
        .join('  ·  ');

// Asistencia final de una clase cuando pasa lista un profesor que solo lleva a parte de las
// alumnas: se conserva lo que ya marcaron los demás y se sustituye solo lo de su alcance.
export const mergePresent = (existingPresent: string[], scopeIds: Set<string>, chosen: string[]): string[] => [
    ...new Set([...existingPresent.filter(id => !scopeIds.has(id)), ...chosen]),
];

// Profesores que llevan a esta alumna en esta clase: los de su grupo si la clase tiene grupos y ella
// tiene uno asignado; si no, todos los de la clase.
export const studentInstructorIds = (rawClass: Record<string, any>, classId: string, rawStudent: Record<string, any>): string[] => {
    const groupId = rawStudent?.classGroups?.[classId];
    const groups: any[] = Array.isArray(rawClass?.groups) ? rawClass.groups : [];
    const group = groupId ? groups.find(g => String(g?.id) === String(groupId)) : undefined;
    return group && Array.isArray(group.instructorIds) && group.instructorIds.length > 0
        ? group.instructorIds.filter((i: unknown): i is string => typeof i === 'string')
        : classInstructorIds(rawClass);
};
