import { DanceClass, Instructor, Student, ClassGroup } from '../../types';

// Una clase puede tener varios profesores repartidos en grupos (ver ClassGroup). Todo el código
// que antes miraba solo class.instructorId pasa por estas funciones, para que una clase con
// grupos cuente para TODOS sus profesores (horas, costes, nombres, borrado).

type ClassLike = Pick<DanceClass, 'instructorId'> & Partial<Pick<DanceClass, 'instructorIds' | 'groups'>>;

export const getClassInstructorIds = (c: ClassLike): string[] => {
    const ids = [
        c.instructorId,
        ...(c.instructorIds || []),
        ...(c.groups || []).flatMap(g => g.instructorIds || []),
    ].filter((id): id is string => typeof id === 'string' && id.length > 0);
    return [...new Set(ids)];
};

export const classHasInstructor = (c: ClassLike, instructorId: string): boolean =>
    !!instructorId && getClassInstructorIds(c).includes(instructorId);

export const classesOfInstructor = (classes: DanceClass[], instructorId: string): DanceClass[] =>
    classes.filter(c => classHasInstructor(c, instructorId));

// "Pablo Palafoll, Vic, Diana": nombres únicos de todos los profesores de la clase. Con
// `firstNameOnly` solo el primer nombre (para espacios pequeños como el horario semanal).
export const getClassInstructorNames = (c: ClassLike, instructors: Pick<Instructor, 'id' | 'name'>[], firstNameOnly = false): string => {
    const names = getClassInstructorIds(c)
        .map(id => instructors.find(i => i.id === id)?.name)
        .filter((n): n is string => !!n)
        .map(n => (firstNameOnly ? n.split(' ')[0] : n));
    return names.join(', ');
};

export const hasGroups = (c: Pick<DanceClass, 'groups'>): boolean => (c.groups || []).length > 0;

export const newGroupId = (): string => `g_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

// Deja la clase coherente antes de guardarla: sin grupos, un único profesor; con grupos, el
// profesor principal es el primero del primer grupo y instructorIds los reúne a todos.
export const normalizeClassInstructors = <T extends ClassLike & { groups?: ClassGroup[] }>(c: T): T & { instructorId: string; instructorIds: string[]; groups: ClassGroup[] } => {
    const groups = (c.groups || [])
        .map(g => ({ ...g, name: g.name.trim(), instructorIds: [...new Set(g.instructorIds || [])] }))
        .filter(g => g.name && g.instructorIds.length > 0);
    if (groups.length === 0) {
        return { ...c, groups: [], instructorIds: c.instructorId ? [c.instructorId] : [] };
    }
    const instructorIds = [...new Set(groups.flatMap(g => g.instructorIds))];
    return { ...c, groups, instructorId: groups[0].instructorIds[0], instructorIds };
};

// Grupo de la alumna en esa clase (undefined si la clase no tiene grupos o aún no está asignada).
export const getStudentGroup = (c: Pick<DanceClass, 'id' | 'groups'>, student: Pick<Student, 'classGroups'>): ClassGroup | undefined => {
    const groupId = student.classGroups?.[c.id];
    return groupId ? (c.groups || []).find(g => g.id === groupId) : undefined;
};

// Profesores que llevan a esa alumna en esa clase: los de su grupo; si no tiene grupo asignado (o
// la clase no tiene grupos), todos los de la clase.
export const getInstructorIdsForStudent = (c: ClassLike & Pick<DanceClass, 'id'>, student: Pick<Student, 'classGroups'>): string[] =>
    getStudentGroup(c as DanceClass, student)?.instructorIds || getClassInstructorIds(c);

// Quita de classGroups las asignaciones a clases en las que la alumna ya no está inscrita o a
// grupos que ya no existen.
export const cleanClassGroups = (
    classGroups: { [classId: string]: string } | undefined,
    enrolledClassIds: string[],
    classes: Pick<DanceClass, 'id' | 'groups'>[]
): { [classId: string]: string } => {
    const result: { [classId: string]: string } = {};
    Object.entries(classGroups || {}).forEach(([classId, groupId]) => {
        const c = classes.find(x => x.id === classId);
        if (c && enrolledClassIds.includes(classId) && (c.groups || []).some(g => g.id === groupId)) result[classId] = groupId;
    });
    return result;
};
