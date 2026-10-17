import { describe, it, expect } from 'vitest';
import {
    monthlyAttendance, classAttendanceStats, studentAttendanceRates, upcomingBirthdays, classesOnDate, weekdayName,
} from './teacherStats';
import { TeacherAttendanceRecord, TeacherClass, TeacherStudent } from '../services/domain/teacherService';

const TODAY = '2026-10-17'; // sábado

const student = (id: string, classIds: string[], birthDate?: string): TeacherStudent =>
    ({ id, name: id.toUpperCase(), birthDate, active: true, enrolledClassIds: classIds });
const rec = (id: string, classId: string, date: string, present: string[]): TeacherAttendanceRecord =>
    ({ id, classId, date, presentStudentIds: present });
const cls = (id: string, days: string[], startTime = '19:00'): TeacherClass =>
    ({ id, name: `Clase ${id}`, category: 'Baile Moderno', days, startTime, endTime: '20:00', capacity: 10 });

describe('monthlyAttendance', () => {
    const students = [student('a', ['c1']), student('b', ['c1'])];
    const records = [
        rec('1', 'c1', '2026-10-01', ['a', 'b']),
        rec('2', 'c1', '2026-10-08', ['a']),
        rec('3', 'c1', '2026-09-10', ['a', 'b']),
    ];
    const points = monthlyAttendance(records, students, TODAY, 3);

    it('devuelve los últimos meses en orden, con el actual al final', () => {
        expect(points.map(p => p.key)).toEqual(['2026-08', '2026-09', '2026-10']);
        expect(points.map(p => p.label)).toEqual(['ago', 'sep', 'oct']);
    });
    it('calcula sesiones, media de asistentes y porcentaje', () => {
        expect(points[2]).toMatchObject({ sessions: 2, avgAttendees: 1.5, percent: 75 });
        expect(points[1]).toMatchObject({ sessions: 1, avgAttendees: 2, percent: 100 });
        expect(points[0]).toMatchObject({ sessions: 0, avgAttendees: 0, percent: 0 });
    });
    it('cruza el cambio de año', () => {
        expect(monthlyAttendance([], [], '2026-02-10', 3).map(p => p.key)).toEqual(['2025-12', '2026-01', '2026-02']);
    });
});

describe('classAttendanceStats', () => {
    it('usa solo las sesiones de la ventana y de esa clase', () => {
        const students = [student('a', ['c1']), student('b', ['c1']), student('c', ['c2'])];
        const stats = classAttendanceStats([cls('c1', []), cls('c2', [])], [
            rec('1', 'c1', '2026-10-10', ['a', 'b']),
            rec('2', 'c1', '2026-10-03', ['a']),
            rec('3', 'c1', '2026-01-01', ['a', 'b']), // fuera de 90 días
            rec('4', 'c2', '2026-10-10', []),
        ], students, TODAY);
        expect(stats[0]).toMatchObject({ classId: 'c1', enrolled: 2, sessions: 2, avgAttendees: 1.5, percent: 75 });
        expect(stats[1]).toMatchObject({ classId: 'c2', enrolled: 1, sessions: 1, avgAttendees: 0, percent: 0 });
    });
});

describe('studentAttendanceRates', () => {
    it('ordena por porcentaje y descarta a quien tiene pocas sesiones', () => {
        const students = [student('a', ['c1']), student('b', ['c1']), student('c', ['c9'])];
        const records = [
            rec('1', 'c1', '2026-10-10', ['a', 'b']),
            rec('2', 'c1', '2026-10-03', ['a']),
            rec('3', 'c1', '2026-09-26', ['a']),
            rec('4', 'c9', '2026-10-01', ['c']),
        ];
        const rates = studentAttendanceRates(students, records, TODAY);
        expect(rates.map(r => [r.studentId, r.percent])).toEqual([['a', 100], ['b', 33]]);
    });
});

describe('upcomingBirthdays', () => {
    it('lista los de los próximos días con la edad que cumplen, ordenados', () => {
        const students = [
            student('a', ['c1'], '2000-10-20'), // en 3 días
            student('b', ['c1'], '2010-10-17'), // hoy
            student('c', ['c1'], '1990-12-25'), // fuera de 30 días
            student('d', ['c1'], '1999-11-10'), // en 24 días
            student('e', ['c1'], undefined),
        ];
        const result = upcomingBirthdays(students, TODAY);
        expect(result.map(r => [r.studentId, r.daysUntil, r.turns])).toEqual([['b', 0, 16], ['a', 3, 26], ['d', 24, 27]]);
    });
    it('mira también al año siguiente cerca de fin de año y trata el 29 de febrero', () => {
        expect(upcomingBirthdays([student('a', ['c1'], '2000-01-03')], '2026-12-28', 30)[0]).toMatchObject({ date: '2027-01-03', daysUntil: 6, turns: 27 });
        expect(upcomingBirthdays([student('a', ['c1'], '2000-02-29')], '2027-02-20', 30)[0]).toMatchObject({ date: '2027-02-28', daysUntil: 8 });
    });
});

describe('classesOnDate', () => {
    it('filtra por día de la semana y ordena por hora', () => {
        expect(weekdayName('2026-10-17')).toBe('Sábado');
        const result = classesOnDate([cls('a', ['Sábado'], '12:00'), cls('b', ['Lunes']), cls('c', ['Sábado', 'Lunes'], '10:00')], '2026-10-17');
        expect(result.map(c => c.id)).toEqual(['c', 'a']);
    });
});
