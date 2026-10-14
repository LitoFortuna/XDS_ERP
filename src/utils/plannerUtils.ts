import { PlannerTask, PlannerTaskCategory, PlannerTaskPriority } from '../../types';

export const PRIORITY_LABEL: Record<PlannerTaskPriority, string> = { high: 'Alta', medium: 'Media', low: 'Baja' };
export const CATEGORIES: PlannerTaskCategory[] = ['Administrativo', 'Clases', 'Eventos', 'Marketing', 'Otro'];

// Fecha local desplazada `days` días respecto a `from` (YYYY-MM-DD), sin pasar por UTC.
export const addDaysIso = (from: Date, days: number): string =>
    toIsoLocal(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days));

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

export const PRIORITY_BAR: Record<PlannerTaskPriority, string> = {
    high: 'bg-rose-400',
    medium: 'bg-amber-400',
    low: 'bg-sky-400',
};

export const PRIORITY_BORDER: Record<PlannerTaskPriority, string> = {
    high: 'border-rose-400',
    medium: 'border-amber-400',
    low: 'border-sky-400',
};

export const PRIORITY_TEXT: Record<PlannerTaskPriority, string> = {
    high: 'text-rose-300',
    medium: 'text-amber-300',
    low: 'text-sky-300',
};

export const PRIORITY_ORDER: Record<PlannerTaskPriority, number> = { high: 0, medium: 1, low: 2 };

// Tinte de fondo de un día del calendario según cuánta carga tiene (tareas pendientes + eventos).
// Los días libres se quedan casi apagados y los más cargados destacan, de modo que las semanas
// apretadas se ven de un vistazo al planificar. Las clases son literales a propósito: Tailwind solo
// genera las que aparecen escritas completas en el código.
export const dayLoadTint = (load: number): string => {
    if (load <= 0) return 'bg-gray-900/40';
    if (load === 1) return 'bg-purple-500/[0.08]';
    if (load === 2) return 'bg-purple-500/[0.15]';
    return 'bg-purple-500/[0.24]';
};

// Orden de las tareas de un mismo día: pendientes antes que hechas, luego por hora (las que no
// tienen hora al final) y por último por prioridad.
export const compareTasks = (a: PlannerTask, b: PlannerTask): number => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const timeA = a.dueTime || '99:99';
    const timeB = b.dueTime || '99:99';
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
};
