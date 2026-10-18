import { describe, it, expect } from 'vitest';
import { attendanceReminderKey } from './notificationUtils';

describe('attendanceReminderKey', () => {
    it('es igual para la misma clase y hora el mismo día (para no programar dos veces)', () => {
        const a = attendanceReminderKey('Salsa', '19:00', new Date(2026, 9, 17, 8, 0));
        const b = attendanceReminderKey('Salsa', '19:00', new Date(2026, 9, 17, 18, 59));
        expect(a).toBe(b);
    });
    it('cambia con la clase, la hora o el día', () => {
        const base = attendanceReminderKey('Salsa', '19:00', new Date(2026, 9, 17));
        expect(attendanceReminderKey('Bachata', '19:00', new Date(2026, 9, 17))).not.toBe(base);
        expect(attendanceReminderKey('Salsa', '20:00', new Date(2026, 9, 17))).not.toBe(base);
        expect(attendanceReminderKey('Salsa', '19:00', new Date(2026, 9, 18))).not.toBe(base);
    });
});
