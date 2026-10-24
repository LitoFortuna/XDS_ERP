import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TeacherActivityTimeline from './TeacherActivityTimeline';
import TeacherActivityLog from './TeacherActivityLog';
import type { TeacherActivityEntry } from '../services/domain/teacherActivityService';

const e = (id: string, over: Partial<TeacherActivityEntry>): TeacherActivityEntry => ({
    id, instructorId: 'i1', instructorName: 'Pablo Palafoll', type: 'access', description: 'Entró al panel de profesor',
    createdAt: new Date(2026, 9, 20, 17, 5).toISOString(), ...over,
});

describe('TeacherActivityTimeline', () => {
    const now = new Date(2026, 9, 20, 20, 0);
    const html = renderToStaticMarkup(React.createElement(TeacherActivityTimeline, { now, entries: [
        e('1', { type: 'attendance_saved', description: 'Pasó lista de «Salsa» del 20/10/2026: 8 presentes de 10', createdAt: new Date(2026, 9, 20, 19, 30).toISOString() }),
        e('2', {}),
        e('3', { instructorName: 'Vic', type: 'account_created', description: 'La administración creó su acceso al ERP', actorEmail: 'raulfdz3@gmail.com', createdAt: new Date(2026, 9, 19, 9, 0).toISOString() }),
    ] }));

    it('agrupa por día con "Hoy" y "Ayer" y muestra hora, profesor, acción y descripción', () => {
        expect(html).toContain('Hoy · Martes, 20 de octubre de 2026');
        expect(html).toContain('Ayer · Lunes, 19 de octubre de 2026');
        expect(html).toContain('19:30');
        expect(html).toContain('Pablo Palafoll');
        expect(html).toContain('Lista pasada');
        expect(html).toContain('Pasó lista de «Salsa» del 20/10/2026: 8 presentes de 10');
        expect(html).toContain('Acceso');
    });
    it('indica quién hizo la acción cuando fue la administración', () => {
        expect(html).toContain('Acceso creado');
        expect(html).toContain('Por raulfdz3@gmail.com');
    });
});

describe('TeacherActivityLog', () => {
    it('sin ser SuperAdmin no muestra nada del registro', () => {
        const html = renderToStaticMarkup(React.createElement(TeacherActivityLog));
        expect(html).toContain('solo está disponible para el SuperAdmin');
        expect(html).not.toContain('Último acceso');
    });
});
