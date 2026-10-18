import { describe, it, expect } from 'vitest';
import {
    classesDueNow, getMadridNow, parseHHMM, reminderSendMinute, buildReminderMessage, ReminderClass, MadridNow,
} from '../../functions/src/classReminders';

const cls = (over: Partial<ReminderClass>): ReminderClass => ({
    id: 'c1', name: 'Salsa', days: ['Martes'], startTime: '19:00', ...over,
});
const at = (weekday: string, hhmm: string): MadridNow => ({ weekday, minutes: parseHHMM(hhmm)!, dateIso: '2026-10-20' });

describe('reminderSendMinute', () => {
    it('avisa 2 horas antes', () => {
        expect(reminderSendMinute(19 * 60)).toBe(17 * 60);
    });
    it('no avisa antes de las 08:00: se adelanta a las 08:00', () => {
        expect(reminderSendMinute(9 * 60)).toBe(8 * 60);
    });
    it('no avisa si la clase es tan temprana que el aviso sería inútil', () => {
        expect(reminderSendMinute(8 * 60 + 15)).toBeNull();
        expect(reminderSendMinute(7 * 60)).toBeNull();
    });
});

describe('classesDueNow', () => {
    it('incluye la clase en la ejecución cuyo tramo contiene su minuto de aviso', () => {
        expect(classesDueNow([cls({})], at('Martes', '17:00'))).toHaveLength(1);
        expect(classesDueNow([cls({})], at('Martes', '17:14'))).toHaveLength(1);
    });
    it('cada clase cae en una sola ejecución (tramos de 15 min sin solaparse)', () => {
        const hits = ['16:45', '17:00', '17:15', '17:30'].filter(t => classesDueNow([cls({})], at('Martes', t)).length > 0);
        expect(hits).toEqual(['17:00']);
    });
    it('un aviso a las 17:10 sale en la ejecución de las 17:15', () => {
        const c = cls({ startTime: '19:10' });
        expect(classesDueNow([c], at('Martes', '17:00'))).toHaveLength(0);
        expect(classesDueNow([c], at('Martes', '17:15'))).toHaveLength(1);
    });
    it('ignora otros días, clases borradas y horas mal formadas', () => {
        expect(classesDueNow([cls({})], at('Miércoles', '17:00'))).toHaveLength(0);
        expect(classesDueNow([cls({ deletedAt: '2026-01-01' })], at('Martes', '17:00'))).toHaveLength(0);
        expect(classesDueNow([cls({ startTime: 'tarde' })], at('Martes', '17:00'))).toHaveLength(0);
    });
});

describe('getMadridNow', () => {
    it('convierte desde UTC a hora de Madrid (verano UTC+2, invierno UTC+1)', () => {
        expect(getMadridNow(new Date('2026-07-14T15:30:00Z'))).toEqual({ weekday: 'Martes', minutes: 17 * 60 + 30, dateIso: '2026-07-14' });
        expect(getMadridNow(new Date('2026-12-15T15:30:00Z'))).toEqual({ weekday: 'Martes', minutes: 16 * 60 + 30, dateIso: '2026-12-15' });
    });
    it('cambia de día según Madrid, no según UTC', () => {
        const now = getMadridNow(new Date('2026-07-14T22:30:00Z'));
        expect(now.dateIso).toBe('2026-07-15');
        expect(now.weekday).toBe('Miércoles');
    });
});

describe('buildReminderMessage', () => {
    it('con una clase mantiene el texto de siempre', () => {
        expect(buildReminderMessage([{ className: 'Salsa', startTime: '19:00', instructorName: 'Carlos' }])).toEqual({
            title: '💃 Salsa a las 19:00',
            body: 'Tu clase es hoy a las 19:00 con Carlos. ¡Te esperamos!',
        });
        expect(buildReminderMessage([{ className: 'Salsa', startTime: '19:00' }]).body).toBe('Tu clase es hoy a las 19:00. ¡Te esperamos!');
    });

    it('con varias clases manda un único aviso ordenado por hora', () => {
        const msg = buildReminderMessage([
            { className: 'Bachata', startTime: '20:30' },
            { className: 'Salsa', startTime: '19:00' },
        ]);
        expect(msg.title).toBe('💃 Hoy tienes 2 clases');
        expect(msg.body).toBe('Salsa a las 19:00 · Bachata a las 20:30. ¡Te esperamos!');
    });
});
