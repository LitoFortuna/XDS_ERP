import { DanceClass, DanceEvent, MerchandiseSale, Student } from '../types';
import { getInstructorIdsForStudent } from '../src/utils/classInstructors';

// Reglas de los logros, calculadas SIEMPRE a partir de los datos reales (asistencia, eventos y
// compras). Antes los logros dependían de studentProgress.achievements, que nadie rellenaba (la
// función que los calculaba no se llamaba desde ningún sitio), así que casi ninguno se desbloqueaba.
// Cada regla devuelve la fecha (YYYY-MM-DD) en la que se cumplió, o nada si aún no.

export interface BadgeData {
    student: Pick<Student, 'id' | 'classGroups'>;
    attendance: Array<{ classId: string; date: string }>;
    classes: DanceClass[];
    events: DanceEvent[];
    sales: Array<Pick<MerchandiseSale, 'itemName' | 'saleDate' | 'studentId'>>;
    today: string; // YYYY-MM-DD
}

/** badgeId -> fecha en la que se cumplió el requisito. Solo contiene los logros conseguidos. */
export type EarnedBadges = Record<string, string>;

export const WEEKLY_MINUTES_GOAL = 180; // "más de 3 horas": estrictamente más
export const STREAK_BADGE_CLASSES = 30;
export const WARRIOR_CLASSES = 50;

const DAY_MS = 86400000;
const isoToMs = (iso: string) => Date.parse(iso + 'T00:00:00Z');
const isIso = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !isNaN(isoToMs(value.slice(0, 10)));

// Sin acentos y en minúsculas, para buscar "camiseta" también en "CAMISETA XDS" o "Camisetá".
const normalize = (text: string): string => (text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const classMinutes = (c: Pick<DanceClass, 'startTime' | 'endTime'> | undefined): number => {
    const parse = (t?: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
    const start = parse(c?.startTime);
    const end = parse(c?.endTime);
    return start !== null && end !== null && end > start ? end - start : 60; // sin horas válidas se asume 1 h
};

// Lunes de la semana (YYYY-MM-DD) a la que pertenece la fecha: agrupa las clases por semana natural.
const weekStart = (iso: string): string => {
    const ms = isoToMs(iso.slice(0, 10));
    const dow = new Date(ms).getUTCDay(); // 0 = domingo
    return new Date(ms - ((dow + 6) % 7) * DAY_MS).toISOString().slice(0, 10);
};

// Palabra clave que identifica cada artículo del que hay logro.
export const MERCH_KEYWORDS: Record<string, string> = {
    merch_tshirt: 'camiseta',
    merch_hoodie: 'sudadera',
    merch_backpack: 'mochila',
};

export function computeEarnedBadges(data: BadgeData): EarnedBadges {
    const earned: EarnedBadges = {};
    const set = (id: string, date: string | undefined) => { if (date && !earned[id]) earned[id] = date.slice(0, 10); };

    // Asistencias válidas, sin duplicar (misma clase y día) y de más antigua a más reciente.
    const seen = new Set<string>();
    const attendance = data.attendance
        .filter(r => isIso(r.date))
        .filter(r => { const k = `${r.classId}|${r.date.slice(0, 10)}`; if (seen.has(k)) return false; seen.add(k); return true; })
        .map(r => ({ classId: r.classId, date: r.date.slice(0, 10) }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // --- Asistencia ---
    if (attendance.length >= 1) set('first_class', attendance[0].date);
    if (attendance.length >= WARRIOR_CLASSES) set('warrior_50', attendance[WARRIOR_CLASSES - 1].date);

    // Racha: clases seguidas con no más de 7 días entre una y la siguiente (igual que la racha que se
    // muestra en el Portal). El logro se consigue al llegar a 30.
    let run = 0;
    attendance.forEach((r, i) => {
        run = i > 0 && (isoToMs(r.date) - isoToMs(attendance[i - 1].date)) / DAY_MS <= 7 ? run + 1 : 1;
        if (run >= STREAK_BADGE_CLASSES) set('streak_30', r.date);
    });

    // Más de 3 horas de clase en una misma semana.
    const classById = new Map(data.classes.map(c => [c.id, c]));
    const minutesByWeek = new Map<string, number>();
    attendance.forEach(r => {
        const week = weekStart(r.date);
        const total = (minutesByWeek.get(week) || 0) + classMinutes(classById.get(r.classId));
        minutesByWeek.set(week, total);
        if (total > WEEKLY_MINUTES_GOAL) set('long_week', r.date);
    });

    // Clases con 2 profesores distintos: se cuentan los profesores que llevan a la alumna en cada
    // clase a la que asistió (los de su grupo si la clase tiene grupos).
    const instructors = new Set<string>();
    attendance.forEach(r => {
        const c = classById.get(r.classId);
        if (!c) return;
        getInstructorIdsForStudent(c, data.student).forEach(id => instructors.add(id));
        if (instructors.size >= 2) set('two_teachers', r.date);
    });

    // --- Eventos: solo los que ya han pasado (asistir/participar) ---
    const pastEvents = data.events
        .filter(e => !e.deletedAt && isIso(e.date) && e.date.slice(0, 10) <= data.today)
        .filter(e => (e.studentIds || []).includes(data.student.id) || (e.participants || []).some(p => p.studentId === data.student.id))
        .sort((a, b) => a.date.localeCompare(b.date));
    if (pastEvents.length > 0) set('first_event', pastEvents[0].date);
    const competition = pastEvents.find(e => e.type === 'Competición');
    if (competition) set('competition', competition.date);

    // --- Compras de merchandising de esta alumna ---
    const mySales = data.sales
        .filter(s => s.studentId === data.student.id && isIso(s.saleDate))
        .sort((a, b) => a.saleDate.localeCompare(b.saleDate));
    Object.entries(MERCH_KEYWORDS).forEach(([badgeId, keyword]) => {
        const sale = mySales.find(s => normalize(s.itemName).includes(keyword));
        if (sale) set(badgeId, sale.saleDate);
    });

    return earned;
}
