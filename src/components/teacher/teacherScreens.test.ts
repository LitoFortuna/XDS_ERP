import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TeacherDashboard from './TeacherDashboard';
import TeacherAttendance from './TeacherAttendance';
import TeacherSchedule from './TeacherSchedule';
import NoAccessScreen from './NoAccessScreen';
import { TeacherOverview } from '../../services/domain/teacherService';

const overview = (over: Partial<TeacherOverview> = {}): TeacherOverview => ({
    today: '2026-10-17', // sábado
    instructor: { id: 'i1', name: 'Carlos Ruiz' },
    classes: [
        { id: 'c1', name: 'Salsa Iniciación', category: 'Baile Moderno', days: ['Sábado'], startTime: '11:00', endTime: '12:00', capacity: 10 },
        { id: 'c2', name: 'Bachata', category: 'Baile Moderno', days: ['Martes'], startTime: '19:00', endTime: '20:00', capacity: 8 },
    ],
    students: [
        { id: 's1', name: 'Ana López', birthDate: '2000-10-20', active: true, enrolledClassIds: ['c1'] },
        { id: 's2', name: 'Berta Gil', birthDate: '1995-05-01', active: true, enrolledClassIds: ['c1', 'c2'] },
    ],
    attendance: [
        { id: 'a1', classId: 'c1', date: '2026-10-10', presentStudentIds: ['s1', 's2'] },
        { id: 'a2', classId: 'c1', date: '2026-10-03', presentStudentIds: ['s1'] },
        { id: 'a3', classId: 'c1', date: '2026-09-26', presentStudentIds: ['s1'] },
    ],
    absences: [{ id: 'x1', classId: 'c1', studentId: 's2', studentName: 'Berta Gil', date: '2026-10-17' }],
    events: [
        { id: 'e1', name: 'Gala de Navidad', type: 'Exhibición', date: '2026-10-19', time: '18:00', location: 'Teatro Municipal', capacity: 50, enrolledCount: 12, myStudents: ['Ana López'] },
    ],
    ...over,
});

const noop = () => undefined;

describe('TeacherDashboard', () => {
    const html = renderToStaticMarkup(React.createElement(TeacherDashboard, { data: overview(), onTakeAttendance: noop, onViewEvents: noop }));

    it('saluda, muestra KPIs y la clase de hoy con botón de pasar lista', () => {
        expect(html).toContain('¡Hola, Carlos!');
        expect(html).toContain('Mis alumnas');
        expect(html).toContain('Salsa Iniciación');
        expect(html).toContain('Pasar lista');
        expect(html).not.toContain('Bachata</p>'); // la de los martes no está en "Hoy"
    });
    it('lista cumpleaños próximos, avisos de ausencia y alumnas constantes', () => {
        expect(html).toContain('Ana López');
        expect(html).toContain('Cumple 26 años');
        expect(html).toContain('Han avisado que no vienen');
        expect(html).toContain('Berta Gil');
    });
    it('muestra los próximos eventos con inscritas y alumnas suyas', () => {
        expect(html).toContain('Próximos eventos');
        expect(html).toContain('Gala de Navidad');
        expect(html).toContain('En 2 días');
        expect(html).toContain('12 inscritas de 50');
        expect(html).toContain('1 alumna tuya');
    });
    it('sin clases asignadas explica que aún no hay nada', () => {
        const empty = renderToStaticMarkup(React.createElement(TeacherDashboard, { data: overview({ classes: [], students: [], attendance: [], absences: [], events: [] }), onTakeAttendance: noop, onViewEvents: noop }));
        expect(empty).toContain('Todavía no tienes clases asignadas');
    });
});

describe('TeacherAttendance', () => {
    it('muestra las alumnas de la clase de hoy y quién avisó que no viene', () => {
        const html = renderToStaticMarkup(React.createElement(TeacherAttendance, { data: overview(), onSaved: noop }));
        expect(html).toContain('Ana López');
        expect(html).toContain('Berta Gil');
        expect(html).toContain('Avisó que no viene');
        expect(html).toContain('Guardar lista');
        expect(html).toContain('max="2026-10-17"');
        expect(html).toContain('min="2026-08-18"');
    });
    it('respeta la clase pedida y solo lista a sus alumnas', () => {
        const html = renderToStaticMarkup(React.createElement(TeacherAttendance, { data: overview(), initialClassId: 'c2', onSaved: noop }));
        expect(html).toContain('Berta Gil');
        expect(html).not.toContain('Ana López');
    });
});

describe('TeacherSchedule', () => {
    it('agrupa por día y resalta hoy', () => {
        const html = renderToStaticMarkup(React.createElement(TeacherSchedule, { data: overview(), onTakeAttendance: noop }));
        expect(html).toContain('Sábado · hoy');
        expect(html).toContain('11:00–12:00');
        expect(html).toContain('Ver alumnas (2)');
        expect(html).toContain('Añadir a mi calendario');
    });
    it('lista los eventos con los nombres de sus alumnas apuntadas', () => {
        const html = renderToStaticMarkup(React.createElement(TeacherSchedule, { data: overview(), onTakeAttendance: noop }));
        expect(html).toContain('Gala de Navidad');
        expect(html).toContain('Teatro Municipal');
        expect(html).toContain('Ana López');
    });
});

describe('NoAccessScreen', () => {
    it('indica el email y cómo conseguir acceso', () => {
        const html = renderToStaticMarkup(React.createElement(NoAccessScreen, { email: 'alguien@correo.es', onLogout: noop }));
        expect(html).toContain('alguien@correo.es');
        expect(html).toContain('Esta cuenta no tiene acceso');
    });
});
