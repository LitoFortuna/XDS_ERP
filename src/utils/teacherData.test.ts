import { describe, it, expect } from 'vitest';
import { chunk, toTeacherStudent, toTeacherClass, toTeacherEvent, validateAttendanceInput } from '../../functions/src/teacherData';

describe('toTeacherStudent', () => {
    const mine = new Set(['c1', 'c2']);

    it('devuelve solo los campos mínimos y solo las clases del profesor', () => {
        const view = toTeacherStudent({
            name: 'Ana', birthDate: '2000-03-15', enrollmentDate: '2024-01-10', active: true,
            enrolledClassIds: ['c1', 'otra'], phone: '600', email: 'a@a.es', monthlyFee: 50, notes: 'secreto', paymentMethod: 'Efectivo',
        }, 's1', mine);
        expect(view).toEqual({ id: 's1', name: 'Ana', birthDate: '2000-03-15', enrollmentDate: '2024-01-10', active: true, enrolledClassIds: ['c1'] });
        expect(JSON.stringify(view)).not.toMatch(/phone|email|monthlyFee|notes|paymentMethod|600|secreto/);
    });

    it('excluye bajas, papelera y alumnas que no están en sus clases', () => {
        expect(toTeacherStudent({ name: 'B', active: false, enrolledClassIds: ['c1'] }, 's', mine)).toBeNull();
        expect(toTeacherStudent({ name: 'B', deletedAt: '2026-01-01', enrolledClassIds: ['c1'] }, 's', mine)).toBeNull();
        expect(toTeacherStudent({ name: 'B', active: true, enrolledClassIds: ['otra'] }, 's', mine)).toBeNull();
        expect(toTeacherStudent({ name: 'B', active: true }, 's', mine)).toBeNull();
    });
});

describe('toTeacherClass', () => {
    it('no expone tarifas', () => {
        const view = toTeacherClass({ name: 'Salsa', category: 'Baile Moderno', days: ['Martes'], startTime: '19:00', endTime: '20:00', capacity: 12, baseRate: 99, instructorId: 'i' }, 'c1');
        expect(view).toEqual({ id: 'c1', name: 'Salsa', category: 'Baile Moderno', days: ['Martes'], startTime: '19:00', endTime: '20:00', capacity: 12 });
    });
});

describe('validateAttendanceInput', () => {
    const today = '2026-10-17';
    const base = { classId: 'c1', date: '2026-10-16', presentStudentIds: ['a', 'b', 'a'], notes: ' hola ' };

    it('acepta una entrada correcta, sin duplicados y con notas recortadas', () => {
        expect(validateAttendanceInput(base, today)).toEqual({ ok: true, value: { classId: 'c1', date: '2026-10-16', presentStudentIds: ['a', 'b'], notes: 'hola' } });
    });
    it('acepta hoy y el límite de 60 días, rechaza futuro y más antiguo', () => {
        expect(validateAttendanceInput({ ...base, date: today }, today).ok).toBe(true);
        expect(validateAttendanceInput({ ...base, date: '2026-08-18' }, today).ok).toBe(true); // 60 días
        expect(validateAttendanceInput({ ...base, date: '2026-08-17' }, today).ok).toBe(false); // 61 días
        expect(validateAttendanceInput({ ...base, date: '2026-10-18' }, today).ok).toBe(false);
    });
    it('rechaza fechas inexistentes o mal formadas y listas inválidas', () => {
        expect(validateAttendanceInput({ ...base, date: '2026-02-30' }, today).ok).toBe(false);
        expect(validateAttendanceInput({ ...base, date: 'ayer' }, today).ok).toBe(false);
        expect(validateAttendanceInput({ ...base, classId: ' ' }, today).ok).toBe(false);
        expect(validateAttendanceInput({ ...base, presentStudentIds: 'a' }, today).ok).toBe(false);
        expect(validateAttendanceInput({ ...base, presentStudentIds: ['a', 5] }, today).ok).toBe(false);
        expect(validateAttendanceInput(null, today).ok).toBe(false);
    });
});

describe('chunk', () => {
    it('parte en trozos del tamaño pedido', () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
        expect(chunk([], 3)).toEqual([]);
    });
});

describe('toTeacherEvent', () => {
    const names = new Map([['s1', 'Ana'], ['s2', 'Berta']]);
    const raw = {
        name: 'Gala', type: 'Exhibición', date: '2026-10-20', time: '18:00', location: 'Teatro', capacity: 50,
        studentIds: ['s1', 'x9'], participants: [{ studentId: 's2', ticketCount: 2 }, { studentId: 's1', ticketCount: 1 }],
        price: 15, notes: 'pagar al técnico', imageUrl: 'http://x',
    };

    it('cuenta inscritas sin duplicar y nombra solo a las alumnas del profesor, sin precio ni notas', () => {
        const view = toTeacherEvent(raw, 'e1', '2026-10-17', names);
        expect(view).toEqual({ id: 'e1', name: 'Gala', type: 'Exhibición', date: '2026-10-20', time: '18:00', location: 'Teatro', capacity: 50, enrolledCount: 3, myStudents: ['Ana', 'Berta'] });
        expect(JSON.stringify(view)).not.toMatch(/price|notes|pagar|x9|imageUrl/);
    });
    it('incluye el evento de hoy y descarta pasados, borrados y sin fecha válida', () => {
        expect(toTeacherEvent({ ...raw, date: '2026-10-17' }, 'e', '2026-10-17', names)).not.toBeNull();
        expect(toTeacherEvent({ ...raw, date: '2026-10-16' }, 'e', '2026-10-17', names)).toBeNull();
        expect(toTeacherEvent({ ...raw, deletedAt: '2026-01-01' }, 'e', '2026-10-17', names)).toBeNull();
        expect(toTeacherEvent({ ...raw, date: 'pronto' }, 'e', '2026-10-17', names)).toBeNull();
    });
    it('sin participantes ni alumnas suyas devuelve cero y lista vacía', () => {
        expect(toTeacherEvent({ name: 'Taller', date: '2026-11-01' }, 'e', '2026-10-17', names)).toMatchObject({ enrolledCount: 0, myStudents: [] });
    });
});
