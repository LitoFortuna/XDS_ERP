import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClassForm } from './ClassSchedule';
import { DanceClass, Instructor, Student } from '../../types';

const instructors = [
    { id: 'pablo', name: 'Pablo Palafoll' }, { id: 'vic', name: 'Vic Ruiz' }, { id: 'diana', name: 'Diana López' },
] as Instructor[];

const mini = {
    id: 'mini', name: 'Competición MiniSolista/MiniParejas', instructorId: 'pablo', category: 'Competición',
    days: ['Viernes'], startTime: '16:00', endTime: '17:30', capacity: 15, baseRate: 20,
    groups: [
        { id: 'g1', name: 'Parejas', instructorIds: ['pablo'] },
        { id: 'g2', name: 'Solista', instructorIds: ['vic', 'diana'] },
    ],
} as unknown as DanceClass;

const students = [
    { id: 's1', name: 'Irene Espejo', enrolledClassIds: ['mini'], classGroups: { mini: 'g2' }, active: true },
    { id: 's2', name: 'Lucía Pareja', enrolledClassIds: ['mini'], classGroups: { mini: 'g1' }, active: true },
] as unknown as Student[];

const noop = () => undefined;

describe('ClassForm con grupos', () => {
    it('muestra los grupos con sus profesores y oculta el selector de profesor único', () => {
        const html = renderToStaticMarkup(React.createElement(ClassForm, { danceClass: mini, instructors, students, onSubmit: noop, onCancel: noop, onAssignGroups: noop }));
        expect(html).toContain('Esta clase tiene varios grupos con distintos profesores');
        expect(html).toContain('value="Parejas"');
        expect(html).toContain('value="Solista"');
        expect(html).not.toContain('Profesor Asignado');
        expect(html).toContain('+ Añadir grupo');
    });

    it('permite asignar cada alumna inscrita a un grupo', () => {
        const html = renderToStaticMarkup(React.createElement(ClassForm, { danceClass: mini, instructors, students, onSubmit: noop, onCancel: noop, onAssignGroups: noop }));
        expect(html).toContain('Alumnos inscritos por grupo (2)');
        expect(html).toContain('aria-label="Grupo de Irene Espejo"');
        expect(html).toContain('Sin grupo');
    });

    it('una clase sin grupos conserva el selector de un único profesor', () => {
        const simple = { ...mini, groups: [] } as unknown as DanceClass;
        const html = renderToStaticMarkup(React.createElement(ClassForm, { danceClass: simple, instructors, students, onSubmit: noop, onCancel: noop }));
        expect(html).toContain('Profesor Asignado');
        expect(html).not.toContain('Nombre del grupo 1');
    });
});
