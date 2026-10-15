import { describe, it, expect } from 'vitest';
import { getBirthdaysByDate } from './plannerUtils';
import { Student } from '../../types';

const student = (over: Partial<Student>): Student => ({
    id: 'a', name: 'Ana', active: true, birthDate: '2000-03-15', ...over,
} as Student);

describe('getBirthdaysByDate', () => {
    it('coloca el cumpleaños en cada año pedido con la edad que cumple', () => {
        const map = getBirthdaysByDate([student({})], [2026, 2027]);
        expect(map.get('2026-03-15')?.[0].age).toBe(26);
        expect(map.get('2027-03-15')?.[0].age).toBe(27);
    });

    it('ignora bajas, alumnas en la papelera y fechas ausentes o mal formadas', () => {
        const map = getBirthdaysByDate([
            student({ id: '1', active: false }),
            student({ id: '2', deletedAt: '2026-01-01' }),
            student({ id: '3', birthDate: undefined }),
            student({ id: '4', birthDate: 'no-es-fecha' }),
        ], [2026]);
        expect(map.size).toBe(0);
    });

    it('no cuenta el año de nacimiento como cumpleaños', () => {
        expect(getBirthdaysByDate([student({ birthDate: '2026-03-15' })], [2026]).size).toBe(0);
    });

    it('el 29 de febrero se celebra el 28 en años no bisiestos', () => {
        const map = getBirthdaysByDate([student({ birthDate: '2000-02-29' })], [2027, 2028]);
        expect(map.has('2027-02-28')).toBe(true);
        expect(map.has('2028-02-29')).toBe(true);
    });

    it('ordena por nombre varias alumnas del mismo día', () => {
        const map = getBirthdaysByDate([student({ id: '1', name: 'Zoe' }), student({ id: '2', name: 'Ana' })], [2026]);
        expect(map.get('2026-03-15')?.map(e => e.student.name)).toEqual(['Ana', 'Zoe']);
    });
});
