import { Student } from '../../types';

export interface Celebration {
    kind: 'birthday' | 'anniversary';
    /** Edad que cumple (cumpleaños) o años desde la matrícula (aniversario). */
    years: number;
}

// Si la fecha (YYYY-MM-DD) cae hoy, devuelve cuántos años han pasado; null si no es hoy o es
// inválida. Se lee como texto (no con new Date, que pasa por UTC). Quien celebra un 29 de febrero
// lo hace el 28 en los años no bisiestos, igual que en el Calendario del panel.
const yearsIfToday = (isoDate: string | undefined, now: Date): number | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate || '');
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const lastDay = new Date(now.getFullYear(), month, 0).getDate();
    const years = now.getFullYear() - year;
    if (years <= 0) return null;
    return now.getMonth() + 1 === month && now.getDate() === Math.min(day, lastDay) ? years : null;
};

export const getStudentCelebrations = (
    student: Pick<Student, 'birthDate' | 'enrollmentDate'>,
    now: Date = new Date()
): Celebration[] => {
    const celebrations: Celebration[] = [];
    const age = yearsIfToday(student.birthDate, now);
    if (age !== null) celebrations.push({ kind: 'birthday', years: age });
    const anniversary = yearsIfToday(student.enrollmentDate, now);
    if (anniversary !== null) celebrations.push({ kind: 'anniversary', years: anniversary });
    return celebrations;
};
