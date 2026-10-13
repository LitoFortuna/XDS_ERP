import { PlannerTask, PlannerTaskPriority } from '../../types';

// Fecha local en YYYY-MM-DD. toISOString() convierte a UTC y, en horario español, desplazaría el
// día a ayer cerca de medianoche -- el calendario y el Dashboard trabajan con fechas locales puras.
export const toIsoLocal = (d: Date): string => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
};

export const PRIORITY_DOT: Record<PlannerTaskPriority, string> = {
    high: 'bg-rose-400',
    medium: 'bg-amber-400',
    low: 'bg-sky-400',
};

export const PRIORITY_ORDER: Record<PlannerTaskPriority, number> = { high: 0, medium: 1, low: 2 };

// Orden de las tareas de un mismo día: pendientes antes que hechas, luego por hora (las que no
// tienen hora al final) y por último por prioridad.
export const compareTasks = (a: PlannerTask, b: PlannerTask): number => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const timeA = a.dueTime || '99:99';
    const timeB = b.dueTime || '99:99';
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
};
