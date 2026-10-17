import { describe, it, expect } from 'vitest';
import { getStudentCelebrations } from './celebrations';

describe('getStudentCelebrations', () => {
    it('detecta el cumpleaños de hoy con la edad que cumple', () => {
        expect(getStudentCelebrations({ birthDate: '2000-03-15', enrollmentDate: '2020-09-01' }, new Date(2026, 2, 15)))
            .toEqual([{ kind: 'birthday', years: 26 }]);
    });

    it('detecta el aniversario de matrícula', () => {
        expect(getStudentCelebrations({ birthDate: '2000-03-15', enrollmentDate: '2023-10-17' }, new Date(2026, 9, 17)))
            .toEqual([{ kind: 'anniversary', years: 3 }]);
    });

    it('puede coincidir cumpleaños y aniversario', () => {
        expect(getStudentCelebrations({ birthDate: '1990-05-05', enrollmentDate: '2024-05-05' }, new Date(2026, 4, 5)))
            .toHaveLength(2);
    });

    it('no celebra otros días, ni el año en que ocurrió, ni con fechas ausentes o mal formadas', () => {
        const now = new Date(2026, 2, 15);
        expect(getStudentCelebrations({ birthDate: '2000-03-16', enrollmentDate: '2020-01-01' }, now)).toEqual([]);
        expect(getStudentCelebrations({ birthDate: '2026-03-15', enrollmentDate: '2026-03-15' }, now)).toEqual([]);
        expect(getStudentCelebrations({ birthDate: undefined, enrollmentDate: 'x' }, now)).toEqual([]);
    });

    it('el 29 de febrero se celebra el 28 en años no bisiestos', () => {
        const student = { birthDate: '2000-02-29', enrollmentDate: '2020-01-01' };
        expect(getStudentCelebrations(student, new Date(2027, 1, 28))).toEqual([{ kind: 'birthday', years: 27 }]);
        expect(getStudentCelebrations(student, new Date(2028, 1, 28))).toEqual([]);
        expect(getStudentCelebrations(student, new Date(2028, 1, 29))).toEqual([{ kind: 'birthday', years: 28 }]);
    });
});
