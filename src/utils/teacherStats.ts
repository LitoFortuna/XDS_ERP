import { TeacherAttendanceRecord, TeacherClass, TeacherStudent } from '../services/domain/teacherService';

// Estadísticas del panel del profesor, calculadas en el navegador a partir de lo que devuelve
// teacherOverview (solo sus clases y alumnas). Funciones puras para poder probarlas.

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const enrolledCount = (students: TeacherStudent[], classId: string): number =>
    students.filter(s => s.enrolledClassIds.includes(classId)).length;

const round1 = (n: number) => Math.round(n * 10) / 10;

const addDays = (iso: string, days: number): string =>
    new Date(Date.parse(iso + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);

export interface MonthlyAttendancePoint {
    key: string; // YYYY-MM
    label: string; // "oct"
    sessions: number;
    avgAttendees: number;
    percent: number; // asistentes / inscritas, 0-100
}

// Últimos `months` meses (el actual incluido) con sesiones, media de asistentes y % de asistencia.
export const monthlyAttendance = (
    records: TeacherAttendanceRecord[],
    students: TeacherStudent[],
    todayIso: string,
    months = 6
): MonthlyAttendancePoint[] => {
    const year = Number(todayIso.slice(0, 4));
    const month = Number(todayIso.slice(5, 7)) - 1;
    const points: MonthlyAttendancePoint[] = [];

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(year, month - i, 1));
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        const inMonth = records.filter(r => r.date.startsWith(key));
        const present = inMonth.reduce((sum, r) => sum + r.presentStudentIds.length, 0);
        const slots = inMonth.reduce((sum, r) => sum + enrolledCount(students, r.classId), 0);
        points.push({
            key,
            label: MONTH_LABELS[d.getUTCMonth()],
            sessions: inMonth.length,
            avgAttendees: inMonth.length > 0 ? round1(present / inMonth.length) : 0,
            percent: slots > 0 ? Math.min(100, Math.round((present / slots) * 100)) : 0,
        });
    }
    return points;
};

export interface ClassAttendanceStat {
    classId: string;
    name: string;
    enrolled: number;
    capacity: number;
    sessions: number;
    avgAttendees: number;
    percent: number;
}

// Asistencia de cada clase en los últimos `days` días.
export const classAttendanceStats = (
    classes: TeacherClass[],
    records: TeacherAttendanceRecord[],
    students: TeacherStudent[],
    todayIso: string,
    days = 90
): ClassAttendanceStat[] => {
    const since = addDays(todayIso, -days);
    return classes.map(c => {
        const sessions = records.filter(r => r.classId === c.id && r.date >= since && r.date <= todayIso);
        const present = sessions.reduce((sum, r) => sum + r.presentStudentIds.length, 0);
        const enrolled = enrolledCount(students, c.id);
        const avg = sessions.length > 0 ? present / sessions.length : 0;
        return {
            classId: c.id,
            name: c.name,
            enrolled,
            capacity: c.capacity,
            sessions: sessions.length,
            avgAttendees: round1(avg),
            percent: enrolled > 0 && sessions.length > 0 ? Math.min(100, Math.round((avg / enrolled) * 100)) : 0,
        };
    });
};

export interface StudentRate {
    studentId: string;
    name: string;
    sessions: number;
    attended: number;
    percent: number;
}

// Porcentaje de asistencia de cada alumna a las sesiones de sus clases en los últimos `days` días
// (solo con `minSessions` sesiones o más, para que un 1 de 1 no cuente como "constante").
export const studentAttendanceRates = (
    students: TeacherStudent[],
    records: TeacherAttendanceRecord[],
    todayIso: string,
    days = 90,
    minSessions = 3
): StudentRate[] => {
    const since = addDays(todayIso, -days);
    const recent = records.filter(r => r.date >= since && r.date <= todayIso);
    return students
        .map(s => {
            const sessions = recent.filter(r => s.enrolledClassIds.includes(r.classId));
            const attended = sessions.filter(r => r.presentStudentIds.includes(s.id)).length;
            return {
                studentId: s.id,
                name: s.name,
                sessions: sessions.length,
                attended,
                percent: sessions.length > 0 ? Math.round((attended / sessions.length) * 100) : 0,
            };
        })
        .filter(r => r.sessions >= minSessions)
        .sort((a, b) => b.percent - a.percent || b.attended - a.attended || a.name.localeCompare(b.name, 'es'));
};

export interface UpcomingBirthday {
    studentId: string;
    name: string;
    date: string; // YYYY-MM-DD de la próxima celebración
    daysUntil: number;
    turns: number;
}

// Cumpleaños de las alumnas entre hoy y dentro de `withinDays` días (el 29 de febrero se celebra el
// 28 en años no bisiestos).
export const upcomingBirthdays = (students: TeacherStudent[], todayIso: string, withinDays = 30): UpcomingBirthday[] => {
    const year = Number(todayIso.slice(0, 4));
    const result: UpcomingBirthday[] = [];

    students.forEach(s => {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.birthDate || '');
        if (!match) return;
        const birthYear = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        if (month < 1 || month > 12 || day < 1 || day > 31) return;

        for (const y of [year, year + 1]) {
            const turns = y - birthYear;
            if (turns <= 0) continue;
            const lastDay = new Date(Date.UTC(y, month, 0)).getUTCDate();
            const date = `${y}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
            const daysUntil = Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(todayIso + 'T00:00:00Z')) / 86400000);
            if (daysUntil >= 0 && daysUntil <= withinDays) {
                result.push({ studentId: s.id, name: s.name, date, daysUntil, turns });
                break;
            }
        }
    });

    return result.sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name, 'es'));
};

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const weekdayName = (iso: string): string => WEEKDAYS[new Date(Date.parse(iso + 'T12:00:00Z')).getUTCDay()];

// Clases que tiene el profesor en la fecha dada, ordenadas por hora.
export const classesOnDate = (classes: TeacherClass[], iso: string): TeacherClass[] => {
    const day = weekdayName(iso);
    return classes.filter(c => c.days.includes(day)).sort((a, b) => a.startTime.localeCompare(b.startTime));
};
