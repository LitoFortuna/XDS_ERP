import { describe, it, expect } from 'vitest';
import {
    getClassInstructorIds, classHasInstructor, classesOfInstructor, getClassInstructorNames, normalizeClassInstructors,
    getStudentGroup, getInstructorIdsForStudent, cleanClassGroups, hasGroups,
} from './classInstructors';
import { DanceClass } from '../../types';

const mini = {
    id: 'mini', instructorId: 'pablo',
    groups: [
        { id: 'g1', name: 'Parejas', instructorIds: ['pablo'] },
        { id: 'g2', name: 'Solista', instructorIds: ['vic', 'diana'] },
    ],
} as unknown as DanceClass;
const simple = { id: 'salsa', instructorId: 'carlos' } as unknown as DanceClass;
const instructors = [{ id: 'pablo', name: 'Pablo Palafoll' }, { id: 'vic', name: 'Vic Ruiz' }, { id: 'diana', name: 'Diana López' }, { id: 'carlos', name: 'Carlos Ruiz' }];

describe('instructores de una clase', () => {
    it('reúne el principal y los de todos los grupos sin duplicar', () => {
        expect(getClassInstructorIds(mini)).toEqual(['pablo', 'vic', 'diana']);
        expect(getClassInstructorIds(simple)).toEqual(['carlos']);
        expect(getClassInstructorIds({ instructorId: '' })).toEqual([]);
    });
    it('una clase con grupos cuenta para todos sus profesores', () => {
        expect(classHasInstructor(mini, 'diana')).toBe(true);
        expect(classHasInstructor(mini, 'carlos')).toBe(false);
        expect(classesOfInstructor([mini, simple], 'vic').map(c => c.id)).toEqual(['mini']);
        expect(classesOfInstructor([mini, simple], 'pablo').map(c => c.id)).toEqual(['mini']);
    });
    it('compone los nombres', () => {
        expect(getClassInstructorNames(mini, instructors)).toBe('Pablo Palafoll, Vic Ruiz, Diana López');
        expect(getClassInstructorNames(mini, instructors, true)).toBe('Pablo, Vic, Diana');
        expect(getClassInstructorNames(simple, instructors)).toBe('Carlos Ruiz');
    });
});

describe('normalizeClassInstructors', () => {
    it('sin grupos deja un único profesor y grupos vacíos', () => {
        expect(normalizeClassInstructors({ instructorId: 'carlos', groups: [] })).toMatchObject({ instructorId: 'carlos', instructorIds: ['carlos'], groups: [] });
    });
    it('con grupos fija el principal (primero del primer grupo) y reúne a todos', () => {
        const out = normalizeClassInstructors({ instructorId: 'otro', groups: [
            { id: 'g1', name: ' Solista ', instructorIds: ['vic', 'diana', 'vic'] },
            { id: 'g2', name: 'Parejas', instructorIds: ['pablo'] },
        ] });
        expect(out.instructorId).toBe('vic');
        expect(out.instructorIds).toEqual(['vic', 'diana', 'pablo']);
        expect(out.groups[0]).toMatchObject({ name: 'Solista', instructorIds: ['vic', 'diana'] });
    });
    it('descarta grupos sin nombre o sin profesor', () => {
        const out = normalizeClassInstructors({ instructorId: 'carlos', groups: [{ id: 'a', name: '', instructorIds: ['x'] }, { id: 'b', name: 'Vacío', instructorIds: [] }] });
        expect(out.groups).toEqual([]);
        expect(out.instructorId).toBe('carlos');
    });
});

describe('grupos de las alumnas', () => {
    it('encuentra el grupo y los profesores de una alumna', () => {
        const irene = { classGroups: { mini: 'g2' } };
        expect(getStudentGroup(mini, irene)?.name).toBe('Solista');
        expect(getInstructorIdsForStudent(mini, irene)).toEqual(['vic', 'diana']);
        expect(getInstructorIdsForStudent(mini, { classGroups: { mini: 'g1' } })).toEqual(['pablo']);
    });
    it('sin grupo asignado la llevan todos los profesores de la clase', () => {
        expect(getStudentGroup(mini, {})).toBeUndefined();
        expect(getInstructorIdsForStudent(mini, {})).toEqual(['pablo', 'vic', 'diana']);
        expect(getInstructorIdsForStudent(simple, {})).toEqual(['carlos']);
    });
    it('cleanClassGroups quita clases no inscritas y grupos inexistentes', () => {
        expect(cleanClassGroups({ mini: 'g1', salsa: 'g9', baja: 'g1', mini2: 'zzz' }, ['mini', 'salsa'], [mini, simple]))
            .toEqual({ mini: 'g1' });
    });
    it('hasGroups', () => {
        expect(hasGroups(mini)).toBe(true);
        expect(hasGroups(simple)).toBe(false);
    });
});
