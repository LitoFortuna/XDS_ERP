import type { TeacherActivityEntry, TeacherActivityType } from '../services/domain/teacherActivityService';

export const ACTIVITY_META: Record<TeacherActivityType, { label: string; icon: string; tone: string }> = {
    access: { label: 'Acceso', icon: '🟢', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    attendance_saved: { label: 'Lista pasada', icon: '✅', tone: 'bg-purple-500/15 text-purple-200 border-purple-500/30' },
    attendance_updated: { label: 'Lista corregida', icon: '✏️', tone: 'bg-amber-500/15 text-amber-200 border-amber-500/30' },
    password_changed: { label: 'Cambio de contraseña', icon: '🔒', tone: 'bg-sky-500/15 text-sky-200 border-sky-500/30' },
    account_created: { label: 'Acceso creado', icon: '🆕', tone: 'bg-indigo-500/15 text-indigo-200 border-indigo-500/30' },
    account_reset: { label: 'Contraseña restablecida', icon: '🔄', tone: 'bg-indigo-500/15 text-indigo-200 border-indigo-500/30' },
    account_revoked: { label: 'Acceso retirado', icon: '⛔', tone: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    admin_action: { label: 'Acción en el ERP', icon: '🛠️', tone: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30' },
};

export const ACTIVITY_TYPE_OPTIONS = (Object.keys(ACTIVITY_META) as TeacherActivityType[]).map(type => ({ type, ...ACTIVITY_META[type] }));

// Día local (YYYY-MM-DD) de una marca de tiempo ISO.
const localDay = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export interface DayGroup {
    day: string; // YYYY-MM-DD
    entries: TeacherActivityEntry[];
}

// Agrupa por día manteniendo el orden recibido (más reciente primero).
export const groupActivityByDay = (entries: TeacherActivityEntry[]): DayGroup[] => {
    const groups: DayGroup[] = [];
    entries.forEach(entry => {
        const day = localDay(entry.createdAt);
        const last = groups[groups.length - 1];
        if (last && last.day === day) last.entries.push(entry);
        else groups.push({ day, entries: [entry] });
    });
    return groups;
};

export const dayHeading = (day: string, now: Date = new Date()): string => {
    const today = localDay(now.toISOString());
    const yesterday = localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString());
    const long = new Date(day + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const capitalized = long.charAt(0).toUpperCase() + long.slice(1);
    if (day === today) return `Hoy · ${capitalized}`;
    if (day === yesterday) return `Ayer · ${capitalized}`;
    return capitalized;
};

// "hace 5 min", "hace 3 h", "hace 2 días", o la fecha si fue hace más de un mes.
export const relativeTime = (iso: string | null | undefined, now: Date = new Date()): string => {
    if (!iso) return 'Nunca ha entrado';
    const diffMs = now.getTime() - new Date(iso).getTime();
    if (isNaN(diffMs)) return 'Nunca ha entrado';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'ahora mismo';
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 31) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const timeOfDay = (iso: string): string =>
    new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
