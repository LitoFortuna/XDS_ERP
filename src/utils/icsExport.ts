// Genera y descarga un archivo .ics de un solo evento, compatible con Google Calendar/Apple
// Calendar/Outlook al abrirlo. No depende de ninguna librería -- el formato iCalendar es texto
// plano simple para un único VEVENT.

interface IcsEventOptions {
    title: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
}

const formatIcsDate = (d: Date): string => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

// Escapa los caracteres que iCalendar trata como especiales en un campo de texto.
const escapeIcsText = (text: string): string =>
    text.replace(/\\/g, '\\\\').replace(/[;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n');

export const downloadIcsEvent = (opts: IcsEventOptions): void => {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Xen Dance Space//Portal de Alumno//ES',
        'BEGIN:VEVENT',
        `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@xendance.space`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(opts.start)}`,
        `DTEND:${formatIcsDate(opts.end)}`,
        `SUMMARY:${escapeIcsText(opts.title)}`,
        opts.description ? `DESCRIPTION:${escapeIcsText(opts.description)}` : '',
        opts.location ? `LOCATION:${escapeIcsText(opts.location)}` : '',
        'END:VEVENT',
        'END:VCALENDAR',
    ].filter(Boolean);

    // CRLF es obligatorio según la RFC 5545, aunque la mayoría de apps toleren \n a secas.
    triggerIcsDownload(lines.join('\r\n'), `${opts.title.replace(/[^a-z0-9]+/gi, '_').slice(0, 50)}.ics`);
};

const triggerIcsDownload = (content: string, filename: string): void => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

// Próxima fecha (a partir de hoy inclusive) en la que cae un día de la semana en español, para
// convertir "esta clase es los Martes" en una fecha concreta con la que generar el .ics.
const SPANISH_WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const getNextOccurrence = (dayName: string, timeHHMM: string, now: Date = new Date()): Date => {
    const targetDayIndex = SPANISH_WEEKDAYS.findIndex((d) => d.toLowerCase() === dayName.toLowerCase());
    const [hours, minutes] = timeHHMM.split(':').map(Number);
    const result = new Date(now);
    result.setHours(hours || 0, minutes || 0, 0, 0);

    if (targetDayIndex === -1) return result;

    let daysUntil = (targetDayIndex - now.getDay() + 7) % 7;
    // Si es hoy pero la hora ya pasó, saltar a la semana que viene.
    if (daysUntil === 0 && result.getTime() < now.getTime()) daysUntil = 7;
    result.setDate(now.getDate() + daysUntil);
    return result;
};

// --- Horario semanal de clases (un solo .ics con una serie semanal por clase y día) ---

export interface IcsClassInput {
    id: string;
    name: string;
    days: string[];
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    instructorName?: string;
}

const ICS_WEEKDAY_CODES: Record<string, string> = {
    lunes: 'MO', martes: 'TU', 'miércoles': 'WE', jueves: 'TH', viernes: 'FR', 'sábado': 'SA', domingo: 'SU',
};

// Hora local "flotante" (sin Z ni zona): el calendario la interpreta en la zona del dispositivo,
// que para quien viene a clase es la misma que la del estudio, y evita tener que incluir un
// VTIMEZONE (que cada app interpreta a su manera). Respeta bien el cambio de horario de verano.
const formatIcsLocal = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
};

// RFC 5545: las líneas no pueden pasar de 75 octetos; las largas se parten con CRLF + espacio.
const foldIcsLine = (line: string): string => {
    const chunks: string[] = [];
    let rest = line;
    while (rest.length > 74) {
        chunks.push(rest.slice(0, 74));
        rest = ' ' + rest.slice(74);
    }
    chunks.push(rest);
    return chunks.join('\r\n');
};

export const buildWeeklyClassesIcs = (classes: IcsClassInput[], now: Date = new Date()): string => {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Xen Dance Space//Portal de Alumno//ES',
        'CALSCALE:GREGORIAN',
        'X-WR-CALNAME:Mis clases - Xen Dance Space',
    ];
    const stamp = formatIcsDate(now);

    classes.forEach(c => {
        c.days.forEach(day => {
            const byDay = ICS_WEEKDAY_CODES[day.toLowerCase()];
            if (!byDay) return;
            const start = getNextOccurrence(day, c.startTime, now);
            const [endH, endM] = c.endTime.split(':').map(Number);
            const end = new Date(start);
            end.setHours(endH || 0, endM || 0, 0, 0);
            if (end <= start) end.setTime(start.getTime() + 60 * 60 * 1000); // sin hora de fin válida: 1 h

            lines.push(
                'BEGIN:VEVENT',
                `UID:clase-${c.id}-${byDay}@xendance.space`,
                `DTSTAMP:${stamp}`,
                `DTSTART:${formatIcsLocal(start)}`,
                `DTEND:${formatIcsLocal(end)}`,
                `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
                `SUMMARY:${escapeIcsText(c.name)}`,
                c.instructorName ? `DESCRIPTION:${escapeIcsText(`Profesor/a: ${c.instructorName}`)}` : '',
                'LOCATION:Xen Dance Space',
                'BEGIN:VALARM',
                'ACTION:DISPLAY',
                `DESCRIPTION:${escapeIcsText(c.name)}`,
                'TRIGGER:-PT1H',
                'END:VALARM',
                'END:VEVENT',
            );
        });
    });

    lines.push('END:VCALENDAR');
    return lines.filter(Boolean).map(foldIcsLine).join('\r\n');
};

export const downloadWeeklyClassesIcs = (classes: IcsClassInput[]): void =>
    triggerIcsDownload(buildWeeklyClassesIcs(classes), 'mis-clases-xen-dance-space.ics');
