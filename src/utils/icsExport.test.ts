import { describe, it, expect } from 'vitest';
import { buildWeeklyClassesIcs, getNextOccurrence } from './icsExport';

// Miércoles 14 de octubre de 2026, 10:00 (hora local del proceso)
const NOW = new Date(2026, 9, 14, 10, 0, 0);

describe('getNextOccurrence', () => {
    it('devuelve hoy si la hora aún no ha pasado y la semana siguiente si ya pasó', () => {
        expect(getNextOccurrence('Miércoles', '18:00', NOW).getDate()).toBe(14);
        expect(getNextOccurrence('Miércoles', '09:00', NOW).getDate()).toBe(21);
        expect(getNextOccurrence('Viernes', '19:30', NOW).getDate()).toBe(16);
    });
});

describe('buildWeeklyClassesIcs', () => {
    const classes = [
        { id: 'a1', name: 'Salsa, nivel 1', days: ['Martes', 'Jueves'], startTime: '19:00', endTime: '20:15', instructorName: 'Carlos' },
        { id: 'b2', name: 'Sábado Kids', days: ['Sábado'], startTime: '11:00', endTime: '12:00' },
    ];
    const ics = buildWeeklyClassesIcs(classes, NOW);
    const lines = ics.split('\r\n');

    it('es un calendario válido con CRLF y un evento por clase y día', () => {
        expect(lines[0]).toBe('BEGIN:VCALENDAR');
        expect(lines[lines.length - 1]).toBe('END:VCALENDAR');
        expect(lines.filter(l => l === 'BEGIN:VEVENT')).toHaveLength(3);
        expect(lines.filter(l => l === 'END:VEVENT')).toHaveLength(3);
    });

    it('repite cada clase semanalmente en su día', () => {
        expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=TU');
        expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=TH');
        expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=SA');
    });

    it('empieza en la próxima ocurrencia con hora local flotante', () => {
        expect(lines).toContain('DTSTART:20261020T190000'); // martes siguiente
        expect(lines).toContain('DTEND:20261020T201500');
        expect(lines).toContain('DTSTART:20261015T190000'); // jueves
        expect(lines).toContain('DTSTART:20261017T110000'); // sábado
    });

    it('escapa los caracteres especiales y usa UIDs estables y distintos', () => {
        expect(lines).toContain('SUMMARY:Salsa\\, nivel 1');
        const uids = lines.filter(l => l.startsWith('UID:'));
        expect(new Set(uids).size).toBe(3);
        expect(buildWeeklyClassesIcs(classes, new Date(2026, 9, 20)).split('\r\n').filter(l => l.startsWith('UID:'))).toEqual(uids);
    });

    it('ignora días que no reconoce y no genera eventos vacíos', () => {
        const out = buildWeeklyClassesIcs([{ id: 'x', name: 'X', days: ['Funday'], startTime: '10:00', endTime: '11:00' }], NOW);
        expect(out).not.toContain('BEGIN:VEVENT');
    });

    it('parte las líneas largas a 75 octetos como pide la RFC', () => {
        const long = buildWeeklyClassesIcs([{ id: 'l', name: 'A'.repeat(200), days: ['Lunes'], startTime: '10:00', endTime: '11:00' }], NOW);
        expect(long.split('\r\n').every(l => l.length <= 75)).toBe(true);
    });
});
