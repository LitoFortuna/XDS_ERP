import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import WeeklySchedule from './WeeklySchedule';
import CelebrationCard from './CelebrationCard';
import { DanceClass, Student } from '../../../types';

const danceClass = (over: Partial<DanceClass>): DanceClass => ({
    id: 'c1', name: 'Salsa Iniciación', instructorId: 'i1', category: 'Salsa' as any, days: ['Martes'],
    startTime: '19:00', endTime: '20:15', capacity: 15, baseRate: 30, instructorName: 'Carlos', ...over,
});

const student = (over: Partial<Student>): Student => ({
    id: 's1', name: 'Laura Martínez Ruiz', enrollmentDate: '2020-01-01', enrolledClassIds: [], monthlyFee: 40,
    paymentMethod: 'Efectivo' as any, active: true, ...over,
});

afterEach(() => vi.useRealTimers());

describe('WeeklySchedule', () => {
    it('agrupa por día de la semana, ordena por hora y muestra profesor', () => {
        const html = renderToStaticMarkup(React.createElement(WeeklySchedule, {
            classes: [
                danceClass({ id: 'b', name: 'Bachata', days: ['Jueves', 'Martes'], startTime: '20:30', endTime: '21:30' }),
                danceClass({ id: 'a', name: 'Salsa Iniciación', days: ['Martes'] }),
            ],
        }));
        expect(html.indexOf('Martes')).toBeLessThan(html.indexOf('Jueves'));
        expect(html.indexOf('Salsa Iniciación')).toBeLessThan(html.indexOf('Bachata')); // 19:00 antes que 20:30 el martes
        expect(html).toContain('19:00–20:15');
        expect(html).toContain('Carlos');
        expect(html).toContain('Añadir mi horario a mi calendario');
    });

    it('sin clases muestra un mensaje y no ofrece exportar', () => {
        const html = renderToStaticMarkup(React.createElement(WeeklySchedule, { classes: [] }));
        expect(html).toContain('Todavía no estás inscrita en ninguna clase');
        expect(html).not.toContain('Añadir mi horario');
    });
});

describe('CelebrationCard', () => {
    it('felicita el día del cumpleaños con el nombre y la edad', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 15, 10, 0, 0));
        const html = renderToStaticMarkup(React.createElement(CelebrationCard, { student: student({ birthDate: '2000-03-15' }) }));
        expect(html).toContain('¡Feliz cumpleaños, Laura!');
        expect(html).toContain('Hoy cumples 26 años');
    });

    it('celebra el aniversario con singular y plural correctos', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 17, 10, 0, 0));
        expect(renderToStaticMarkup(React.createElement(CelebrationCard, { student: student({ enrollmentDate: '2025-10-17' }) })))
            .toContain('¡Un año bailando con nosotras!');
        expect(renderToStaticMarkup(React.createElement(CelebrationCard, { student: student({ enrollmentDate: '2023-10-17' }) })))
            .toContain('¡3 años bailando con nosotras!');
    });

    it('no pinta nada un día normal', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 1, 10, 0, 0));
        expect(renderToStaticMarkup(React.createElement(CelebrationCard, { student: student({ birthDate: '2000-03-15' }) }))).toBe('');
    });
});
