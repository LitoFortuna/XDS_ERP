import { describe, it, expect } from 'vitest';
import {
    shouldLogAccess, describeAttendance, matchesActivityFilters, clampPageSize, isSuperAdminEmail, isTeacherActivityType, mapAdminActivityType, isDirectorEmail, DIRECTOR_EMAIL, sanitizeAdminAction, TeacherActivityEntry,
} from '../../functions/src/teacherActivity';

const entry = (over: Partial<TeacherActivityEntry> = {}): TeacherActivityEntry => ({
    instructorId: 'i1', instructorName: 'Pablo', type: 'access', description: 'x', createdAt: '2026-10-20T10:00:00.000Z', ...over,
});

describe('shouldLogAccess', () => {
    const now = new Date('2026-10-20T12:00:00Z');
    it('registra el primer acceso y los que llegan pasada la ventana', () => {
        expect(shouldLogAccess(undefined, now)).toBe(true);
        expect(shouldLogAccess('no-es-fecha', now)).toBe(true);
        expect(shouldLogAccess('2026-10-20T11:29:00Z', now)).toBe(true); // hace 31 min
    });
    it('no repite el acceso si el anterior fue hace menos de 30 minutos', () => {
        expect(shouldLogAccess('2026-10-20T11:45:00Z', now)).toBe(false);
        expect(shouldLogAccess('2026-10-20T11:30:00Z', now)).toBe(true); // justo 30
    });
});

describe('describeAttendance', () => {
    it('describe la lista pasada o corregida con singular y plural', () => {
        expect(describeAttendance('Salsa', '2026-10-16', 8, 10, false)).toBe('Pasó lista de «Salsa» del 16/10/2026: 8 presentes de 10');
        expect(describeAttendance('Salsa', '2026-10-16', 1, 10, true)).toBe('Corrigió lista de «Salsa» del 16/10/2026: 1 presente de 10');
    });
});

describe('matchesActivityFilters', () => {
    it('filtra por profesor y por tipo', () => {
        expect(matchesActivityFilters(entry(), { instructorId: 'i1' })).toBe(true);
        expect(matchesActivityFilters(entry(), { instructorId: 'i2' })).toBe(false);
        expect(matchesActivityFilters(entry({ type: 'attendance_saved' }), { type: 'access' })).toBe(false);
        expect(matchesActivityFilters(entry(), {})).toBe(true);
    });
    it('filtra por día en hora de Madrid (no UTC)', () => {
        // 22:30 UTC del 20/10 son las 00:30 del 21/10 en Madrid (verano)
        const late = entry({ createdAt: '2026-10-20T22:30:00.000Z' });
        expect(matchesActivityFilters(late, { from: '2026-10-21', to: '2026-10-21' })).toBe(true);
        expect(matchesActivityFilters(late, { to: '2026-10-20' })).toBe(false);
        expect(matchesActivityFilters(late, { from: '2026-10-22' })).toBe(false);
    });
});

describe('utilidades', () => {
    it('clampPageSize acota el tamaño de página', () => {
        expect(clampPageSize(undefined)).toBe(50);
        expect(clampPageSize(0)).toBe(50);
        expect(clampPageSize(30)).toBe(30);
        expect(clampPageSize(9999)).toBe(200);
    });
    it('solo el SuperAdmin pasa la comprobación y solo los tipos conocidos son válidos', () => {
        expect(isSuperAdminEmail('raulfdz3@gmail.com')).toBe(true);
        expect(isSuperAdminEmail('info@xendance.space')).toBe(false);
        expect(isSuperAdminEmail(undefined)).toBe(false);
        expect(isTeacherActivityType('password_changed')).toBe(true);
        expect(isTeacherActivityType('delete_everything')).toBe(false);
    });
});

describe('actividad de la dirección (Xenia)', () => {
    it('solo la cuenta de dirección se reconoce como tal', () => {
        expect(isDirectorEmail(DIRECTOR_EMAIL)).toBe(true);
        expect(isDirectorEmail('raulfdz3@gmail.com')).toBe(false);
        expect(isDirectorEmail(undefined)).toBe(false);
        expect(isDirectorEmail('INFO@xendance.space')).toBe(false);
    });
    it('solo la asistencia se copia desde activityLogs; cobros y gastos se anotan en origen', () => {
        expect(mapAdminActivityType('attendance')).toBe('attendance_saved');
        expect(mapAdminActivityType('payment')).toBeNull();
        expect(mapAdminActivityType('cost')).toBeNull();
        expect(mapAdminActivityType(undefined)).toBeNull();
    });
    it('sanitizeAdminAction acepta solo tipos conocidos y limpia la descripción', () => {
        expect(sanitizeAdminAction({ kind: 'student_added', description: '  Dio de alta a «Ana»  ' })).toEqual({ kind: 'student_added', description: 'Dio de alta a «Ana»' });
        expect(sanitizeAdminAction({ kind: 'student_added', description: 'a\n\tb\u0000c' })?.description).toBe('a b c');
        expect(sanitizeAdminAction({ kind: 'student_added', description: 'x'.repeat(1000) })?.description).toHaveLength(300);
    });
    it('sanitizeAdminAction rechaza tipos desconocidos y descripciones vacías', () => {
        expect(sanitizeAdminAction({ kind: 'borrar_todo', description: 'x' })).toBeNull();
        expect(sanitizeAdminAction({ kind: 'cost_added', description: '   ' })).toBeNull();
        expect(sanitizeAdminAction({ kind: 'cost_added' })).toBeNull();
        expect(sanitizeAdminAction(null)).toBeNull();
    });
});
