import { describe, it, expect } from 'vitest';
import { computeEarnedBadges, BadgeData } from '../../services/badgeRules';
import { DanceClass, DanceEvent } from '../../types';

const cls = (id: string, instructorId: string, start = '19:00', end = '20:00', extra: Partial<DanceClass> = {}): DanceClass =>
    ({ id, name: id, instructorId, category: 'Baile Moderno', days: ['Lunes'], startTime: start, endTime: end, capacity: 10, baseRate: 20, ...extra } as DanceClass);

const base = (over: Partial<BadgeData> = {}): BadgeData => ({
    student: { id: 's1', classGroups: {} },
    attendance: [], classes: [], events: [], sales: [], today: '2026-10-17', ...over,
});

const event = (id: string, type: DanceEvent['type'], date: string, studentIds: string[] = ['s1']): DanceEvent =>
    ({ id, name: id, type, studentIds, date, time: '18:00', location: 'x', price: 0, participants: [] } as DanceEvent);

describe('logros de asistencia', () => {
    it('primera clase y 50 clases, con la fecha en que se cumplió', () => {
        const attendance = Array.from({ length: 50 }, (_, i) => ({ classId: 'a', date: new Date(Date.UTC(2026, 0, 1 + i * 7)).toISOString().slice(0, 10) }));
        const earned = computeEarnedBadges(base({ attendance, classes: [cls('a', 'i1')] }));
        expect(earned.first_class).toBe('2026-01-01');
        expect(earned.warrior_50).toBe(attendance[49].date);
        expect(computeEarnedBadges(base({ attendance: attendance.slice(0, 49), classes: [cls('a', 'i1')] })).warrior_50).toBeUndefined();
    });

    it('no cuenta dos veces la misma clase del mismo día ni fechas inválidas', () => {
        const earned = computeEarnedBadges(base({ attendance: [{ classId: 'a', date: 'ayer' }, { classId: 'a', date: '' }] }));
        expect(earned.first_class).toBeUndefined();
    });

    it('racha de 30 clases con huecos de hasta 7 días', () => {
        const weekly = Array.from({ length: 30 }, (_, i) => ({ classId: 'a', date: new Date(Date.UTC(2026, 0, 1 + i * 7)).toISOString().slice(0, 10) }));
        expect(computeEarnedBadges(base({ attendance: weekly })).streak_30).toBe(weekly[29].date);
        const broken = weekly.map((r, i) => (i >= 15 ? { ...r, date: new Date(Date.UTC(2026, 0, 1 + i * 7 + 20)).toISOString().slice(0, 10) } : r));
        expect(computeEarnedBadges(base({ attendance: broken })).streak_30).toBeUndefined();
    });
});

describe('más de 3 horas en una semana', () => {
    const classes = [cls('a', 'i1', '18:00', '19:00'), cls('b', 'i1', '19:00', '20:30')];
    it('suma los minutos de las clases asistidas dentro de la misma semana (lunes a domingo)', () => {
        // 1h + 1h30 + 1h = 3h30 > 3h en la semana del 12 al 18 de octubre de 2026
        const earned = computeEarnedBadges(base({
            classes,
            attendance: [{ classId: 'a', date: '2026-10-12' }, { classId: 'b', date: '2026-10-14' }, { classId: 'a', date: '2026-10-16' }],
        }));
        expect(earned.long_week).toBe('2026-10-16');
    });
    it('exactamente 3 horas no basta, ni repartidas en semanas distintas', () => {
        expect(computeEarnedBadges(base({ classes, attendance: [{ classId: 'a', date: '2026-10-12' }, { classId: 'a', date: '2026-10-13' }, { classId: 'a', date: '2026-10-14' }] })).long_week).toBeUndefined();
        expect(computeEarnedBadges(base({ classes, attendance: [{ classId: 'b', date: '2026-10-18' }, { classId: 'b', date: '2026-10-19' }, { classId: 'b', date: '2026-10-25' }] })).long_week).toBeUndefined(); // domingo y lunes son semanas distintas
    });
});

describe('profesores distintos', () => {
    it('se consigue al recibir clase de 2 profesores', () => {
        const classes = [cls('a', 'carlos'), cls('b', 'pablo')];
        const earned = computeEarnedBadges(base({ classes, attendance: [{ classId: 'a', date: '2026-09-01' }, { classId: 'b', date: '2026-09-08' }] }));
        expect(earned.two_teachers).toBe('2026-09-08');
    });
    it('con un solo profesor no', () => {
        const classes = [cls('a', 'carlos'), cls('b', 'carlos')];
        expect(computeEarnedBadges(base({ classes, attendance: [{ classId: 'a', date: '2026-09-01' }, { classId: 'b', date: '2026-09-08' }] })).two_teachers).toBeUndefined();
    });
    it('en una clase con grupos cuentan los profesores de SU grupo', () => {
        const mini = cls('mini', 'pablo', '16:00', '17:30', { groups: [{ id: 'g1', name: 'Parejas', instructorIds: ['pablo'] }, { id: 'g2', name: 'Solista', instructorIds: ['vic', 'diana'] }] });
        const pareja = computeEarnedBadges(base({ student: { id: 's1', classGroups: { mini: 'g1' } }, classes: [mini], attendance: [{ classId: 'mini', date: '2026-09-01' }] }));
        const solista = computeEarnedBadges(base({ student: { id: 's1', classGroups: { mini: 'g2' } }, classes: [mini], attendance: [{ classId: 'mini', date: '2026-09-01' }] }));
        expect(pareja.two_teachers).toBeUndefined(); // solo Pablo
        expect(solista.two_teachers).toBe('2026-09-01'); // Vic y Diana
    });
});

describe('eventos y competiciones', () => {
    it('asistir a un evento pasado desbloquea el logro de evento, no el de competición', () => {
        const earned = computeEarnedBadges(base({ events: [event('e1', 'Exhibición', '2026-06-20')] }));
        expect(earned.first_event).toBe('2026-06-20');
        expect(earned.competition).toBeUndefined();
    });
    it('participar en una competición pasada desbloquea ambos', () => {
        const earned = computeEarnedBadges(base({ events: [event('e1', 'Competición', '2026-05-10')] }));
        expect(earned.first_event).toBe('2026-05-10');
        expect(earned.competition).toBe('2026-05-10');
    });
    it('un evento futuro, borrado o de otra alumna no cuenta', () => {
        const earned = computeEarnedBadges(base({ events: [
            event('futuro', 'Competición', '2026-12-01'),
            { ...event('borrado', 'Competición', '2026-01-01'), deletedAt: '2026-02-01' },
            event('otra', 'Competición', '2026-02-01', ['s9']),
        ] }));
        expect(earned.first_event).toBeUndefined();
        expect(earned.competition).toBeUndefined();
    });
    it('también cuenta si figura en participants', () => {
        const e = { ...event('p', 'Taller', '2026-03-03', []), participants: [{ studentId: 's1', ticketCount: 1 }] } as DanceEvent;
        expect(computeEarnedBadges(base({ events: [e] })).first_event).toBe('2026-03-03');
    });
});

describe('merchandising', () => {
    it('camiseta, sudadera y mochila por el nombre del artículo, sin importar mayúsculas ni acentos', () => {
        const earned = computeEarnedBadges(base({ sales: [
            { itemName: 'CAMISETA XDS (M)', saleDate: '2026-02-01', studentId: 's1' },
            { itemName: 'Sudadera XDS', saleDate: '2026-03-01', studentId: 's1' },
            { itemName: 'Mochila de baile', saleDate: '2026-04-01', studentId: 's1' },
        ] }));
        expect(earned.merch_tshirt).toBe('2026-02-01');
        expect(earned.merch_hoodie).toBe('2026-03-01');
        expect(earned.merch_backpack).toBe('2026-04-01');
    });
    it('las compras de otras alumnas o de otros artículos no cuentan', () => {
        const earned = computeEarnedBadges(base({ sales: [
            { itemName: 'Camiseta XDS', saleDate: '2026-02-01', studentId: 's2' },
            { itemName: 'Botella térmica', saleDate: '2026-02-01', studentId: 's1' },
            { itemName: 'Camiseta XDS', saleDate: '2026-02-01', studentId: undefined },
        ] }));
        expect(earned.merch_tshirt).toBeUndefined();
        expect(Object.keys(earned).filter(k => k.startsWith('merch'))).toEqual([]);
    });
});
