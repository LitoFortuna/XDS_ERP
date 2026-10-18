// Lógica pura (sin Firebase) de los recordatorios de clase, separada de index.ts para poder
// probarla desde el vitest de la raíz (src/utils/classReminders.test.ts).

/** Cuánto antes de empezar la clase se avisa. */
export const REMINDER_LEAD_MINUTES = 120;
/** No se manda ningún aviso antes de esta hora (minutos desde medianoche): las 08:00. */
export const EARLIEST_REMINDER_MINUTE = 8 * 60;
/** Cada cuánto corre la función programada (debe coincidir con el cron de index.ts). */
export const RUN_INTERVAL_MINUTES = 15;
/** Si tras ajustar a las 08:00 quedan menos minutos que estos hasta la clase, no se avisa. */
export const MIN_USEFUL_LEAD_MINUTES = 30;

export interface ReminderClass {
    id: string;
    name: string;
    days: string[];
    startTime: string; // HH:MM
    instructorId?: string;
    deletedAt?: string;
}

export interface MadridNow {
    weekday: string; // Lunes ... Domingo, con la misma ortografía que DanceClass.days
    minutes: number; // minutos desde medianoche
    dateIso: string; // YYYY-MM-DD
}

export const parseHHMM = (value: string | undefined): number | null => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value || '');
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
};

// Día, hora y fecha en Madrid, independientemente de la zona horaria del servidor (las funciones
// corren en UTC, así que new Date().getHours() daría la hora equivocada).
export const getMadridNow = (date: Date): MadridNow => {
    const parts = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid',
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value || '';
    const weekday = get('weekday');
    return {
        weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
        minutes: Number(get('hour')) * 60 + Number(get('minute')),
        dateIso: `${get('year')}-${get('month')}-${get('day')}`,
    };
};

// Minuto del día en el que debe salir el aviso de una clase, o null si no procede (clase
// demasiado temprano para avisar sin madrugar a la alumna).
export const reminderSendMinute = (startMinute: number): number | null => {
    const sendMinute = Math.max(startMinute - REMINDER_LEAD_MINUTES, EARLIEST_REMINDER_MINUTE);
    return startMinute - sendMinute >= MIN_USEFUL_LEAD_MINUTES ? sendMinute : null;
};

// Clases cuyo aviso toca en esta ejecución: su minuto de envío cae en (ahora - intervalo, ahora],
// así cada clase cae en exactamente una ejecución del cron.
export const classesDueNow = (classes: ReminderClass[], now: MadridNow): ReminderClass[] =>
    classes.filter(c => {
        if (c.deletedAt || !c.days?.includes(now.weekday)) return false;
        const start = parseHHMM(c.startTime);
        if (start === null) return false;
        const sendMinute = reminderSendMinute(start);
        return sendMinute !== null && sendMinute <= now.minutes && sendMinute > now.minutes - RUN_INTERVAL_MINUTES;
    });

export interface ReminderItem {
    className: string;
    startTime: string; // HH:MM
    instructorName?: string;
}

// Un solo aviso por alumna y ejecución aunque tenga varias clases a la vez (antes salía un push por
// clase y llegaban "varios de golpe"). Con una clase conserva el texto de siempre.
export const buildReminderMessage = (items: ReminderItem[]): { title: string; body: string } => {
    const sorted = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.className.localeCompare(b.className, 'es'));
    if (sorted.length === 1) {
        const c = sorted[0];
        return {
            title: `💃 ${c.className} a las ${c.startTime}`,
            body: `Tu clase es hoy a las ${c.startTime}${c.instructorName ? ` con ${c.instructorName}` : ''}. ¡Te esperamos!`,
        };
    }
    return {
        title: `💃 Hoy tienes ${sorted.length} clases`,
        body: `${sorted.map(c => `${c.className} a las ${c.startTime}`).join(' · ')}. ¡Te esperamos!`,
    };
};
