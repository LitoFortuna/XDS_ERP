import { DanceClass, DanceEvent, Payment, Student } from '../../types';

// Copia local de lo que la alumna necesita consultar sin conexión (su ficha, sus clases, sus pagos
// del año y los eventos en los que está apuntada). Firestore ya guarda una caché propia, pero solo
// de lo que se consultó antes y sin garantías; esta copia es explícita y también permite que el
// Portal arranque sin red sin cerrar la sesión. No incluye DNI/IBAN (datos privados) ni eventos
// ajenos (llevan los ids de otras alumnas).

const KEY_PREFIX = 'xds-portal-snapshot:';
const SNAPSHOT_VERSION = 1;

export interface PortalSnapshot {
    version: number;
    savedAt: string; // ISO
    student: Student;
    classes: DanceClass[];
    events: DanceEvent[];
    payments: Payment[];
    // Nivel y racha de la pantalla de Inicio (calculados con la asistencia, que no se guarda).
    progress?: { currentStreak: number; level: number; levelName: string; levelIcon: string };
}

export const isStudentInEvent = (event: DanceEvent, studentId: string): boolean =>
    !!event.studentIds?.includes(studentId) || !!event.participants?.some(p => p.studentId === studentId);

export const savePortalSnapshot = (data: Omit<PortalSnapshot, 'version' | 'savedAt'>): void => {
    try {
        const snapshot: PortalSnapshot = {
            version: SNAPSHOT_VERSION,
            savedAt: new Date().toISOString(),
            ...data,
            classes: data.classes.filter(c => data.student.enrolledClassIds?.includes(c.id)),
            events: data.events.filter(e => isStudentInEvent(e, data.student.id)),
        };
        localStorage.setItem(KEY_PREFIX + data.student.id, JSON.stringify(snapshot));
    } catch {
        // Sin almacenamiento o lleno: el modo sin conexión simplemente no estará disponible.
    }
};

export const loadPortalSnapshot = (studentId: string): PortalSnapshot | null => {
    try {
        const raw = localStorage.getItem(KEY_PREFIX + studentId);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PortalSnapshot;
        return parsed?.version === SNAPSHOT_VERSION && parsed.student?.id === studentId ? parsed : null;
    } catch {
        return null;
    }
};

// Al cerrar sesión se borran todas las copias: en un móvil compartido no debe quedar la ficha.
export const clearPortalSnapshots = (): void => {
    try {
        Object.keys(localStorage)
            .filter(k => k.startsWith(KEY_PREFIX))
            .forEach(k => localStorage.removeItem(k));
    } catch {
        // nada que limpiar
    }
};
