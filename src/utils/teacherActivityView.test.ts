import { describe, it, expect } from 'vitest';
import { groupActivityByDay, dayHeading, relativeTime, ACTIVITY_META, ACTIVITY_TYPE_OPTIONS } from './teacherActivityView';
import type { TeacherActivityEntry } from '../services/domain/teacherActivityService';

const entry = (id: string, createdAt: string): TeacherActivityEntry =>
    ({ id, instructorId: 'i1', instructorName: 'Pablo', type: 'access', description: 'x', createdAt });

describe('groupActivityByDay', () => {
    it('agrupa por día conservando el orden (más reciente primero)', () => {
        const groups = groupActivityByDay([
            entry('a', new Date(2026, 9, 20, 18, 0).toISOString()),
            entry('b', new Date(2026, 9, 20, 9, 0).toISOString()),
            entry('c', new Date(2026, 9, 19, 22, 0).toISOString()),
        ]);
        expect(groups.map(g => g.day)).toEqual(['2026-10-20', '2026-10-19']);
        expect(groups[0].entries.map(e => e.id)).toEqual(['a', 'b']);
    });
    it('sin entradas devuelve una lista vacía', () => {
        expect(groupActivityByDay([])).toEqual([]);
    });
});

describe('dayHeading', () => {
    const now = new Date(2026, 9, 20, 12, 0);
    it('marca hoy y ayer, y escribe el resto con la fecha completa', () => {
        expect(dayHeading('2026-10-20', now)).toMatch(/^Hoy · Martes, 20 de octubre de 2026$/);
        expect(dayHeading('2026-10-19', now)).toMatch(/^Ayer · Lunes/);
        expect(dayHeading('2026-10-15', now)).toBe('Jueves, 15 de octubre de 2026');
    });
});

describe('relativeTime', () => {
    const now = new Date('2026-10-20T12:00:00Z');
    it('expresa minutos, horas y días', () => {
        expect(relativeTime('2026-10-20T11:59:40Z', now)).toBe('ahora mismo');
        expect(relativeTime('2026-10-20T11:55:00Z', now)).toBe('hace 5 min');
        expect(relativeTime('2026-10-20T09:00:00Z', now)).toBe('hace 3 h');
        expect(relativeTime('2026-10-19T11:00:00Z', now)).toBe('hace 1 día');
        expect(relativeTime('2026-10-15T11:00:00Z', now)).toBe('hace 5 días');
    });
    it('sin fecha dice que nunca ha entrado', () => {
        expect(relativeTime(null, now)).toBe('Nunca ha entrado');
        expect(relativeTime(undefined, now)).toBe('Nunca ha entrado');
        expect(relativeTime('no-es-fecha', now)).toBe('Nunca ha entrado');
    });
});

describe('catálogo de tipos', () => {
    it('cada tipo tiene etiqueta e icono y todos aparecen en el filtro', () => {
        expect(ACTIVITY_TYPE_OPTIONS).toHaveLength(Object.keys(ACTIVITY_META).length);
        ACTIVITY_TYPE_OPTIONS.forEach(o => { expect(o.label).toBeTruthy(); expect(o.icon).toBeTruthy(); });
    });
});
