import { describe, it, expect } from 'vitest';
import { freezePastFees, getExpectedFee, getPaymentStatusForMonth } from './paymentStatus';
import { existingPaymentsForMonth, resultingMonthTotal, paymentIdsToReplace, sumPayments } from './reconciliation';
import { Student, Payment } from '../../types';

const student = (over: Partial<Student> = {}): Student => ({
    id: 's1', name: 'Ana', enrollmentDate: '2025-09-10', enrolledClassIds: [], monthlyFee: 14, paymentMethod: 'Domiciliación' as any, active: true, ...over,
} as Student);
const pay = (id: string, date: string, amount: number, over: Partial<Payment> = {}): Payment => ({ id, studentId: 's1', amount, date, concept: 'x', paymentMethod: 'Efectivo' as any, ...over } as Payment);

const DEC = new Date(2026, 11, 5); // 5 de diciembre de 2026

describe('freezePastFees', () => {
    it('los meses anteriores conservan la cuota antigua y desde el actual rige la nueva', () => {
        const prev = student({ monthlyFee: 14 });
        const next = student({ monthlyFee: 25 });
        const updated = { ...next, feeExceptions: freezePastFees(prev, next, DEC) };
        expect(getExpectedFee(updated, 2025, 8)).toBe(14); // septiembre 2025
        expect(getExpectedFee(updated, 2026, 10)).toBe(14); // noviembre 2026
        expect(getExpectedFee(updated, 2026, 11)).toBe(25); // diciembre (mes actual)
        expect(getExpectedFee(updated, 2027, 0)).toBe(25);
    });

    it('una alumna al día con 14 € no pasa a pago parcial al subir la cuota', () => {
        const prev = student({ monthlyFee: 14 });
        const next = student({ monthlyFee: 25 });
        const updated = { ...next, feeExceptions: freezePastFees(prev, next, DEC) };
        const payments = [pay('p1', '2026-10-05', 14)];
        expect(getPaymentStatusForMonth(updated, 2026, 9, payments, DEC).status).toBe('paid');
        // sin el congelado, octubre quedaría parcial (14 de 25)
        expect(getPaymentStatusForMonth(next, 2026, 9, payments, DEC).status).toBe('partial');
    });

    it('no toca nada si la cuota no ha cambiado', () => {
        const prev = student({ feeExceptions: { '2026-3': 10 } });
        const next = student({ feeExceptions: { '2026-3': 10 }, name: 'Ana María' });
        expect(freezePastFees(prev, next, DEC)).toEqual({ '2026-3': 10 });
        expect(freezePastFees(student(), student(), DEC)).toBeUndefined();
    });

    it('respeta las excepciones que ya había puestas a mano', () => {
        const prev = student({ monthlyFee: 14, feeExceptions: { '2026-5': 7 } });
        const next = student({ monthlyFee: 25, feeExceptions: { '2026-5': 7 } });
        const result = freezePastFees(prev, next, DEC)!;
        expect(result['2026-5']).toBe(7);
        expect(result['2026-4']).toBe(14);
    });

    it('conserva el agosto reducido cuando cambia la cuota normal y se mantiene la de agosto', () => {
        const prev = student({ monthlyFee: 14, augustMaintenanceFee: 5 });
        const next = student({ monthlyFee: 25, augustMaintenanceFee: 5 });
        const updated = { ...next, feeExceptions: freezePastFees(prev, next, DEC) };
        expect(getExpectedFee(updated, 2026, 7)).toBe(5);
        expect(getExpectedFee(updated, 2026, 6)).toBe(14);
    });

    it('si cambia la cuota de agosto, el agosto ya pasado conserva la suya', () => {
        const prev = student({ monthlyFee: 14, augustMaintenanceFee: 5 });
        const next = student({ monthlyFee: 14, augustMaintenanceFee: 8 });
        const updated = { ...next, feeExceptions: freezePastFees(prev, next, DEC) };
        expect(getExpectedFee(updated, 2026, 7)).toBe(5);
        expect(getExpectedFee(updated, 2027, 7)).toBe(8);
    });

    it('cambiar la cuota a mitad de mes aplica ya a ese mes, no al anterior', () => {
        const prev = student({ monthlyFee: 14 });
        const next = student({ monthlyFee: 25 });
        const updated = { ...next, feeExceptions: freezePastFees(prev, next, new Date(2026, 9, 20)) }; // 20 oct
        expect(getExpectedFee(updated, 2026, 8)).toBe(14); // septiembre
        expect(getExpectedFee(updated, 2026, 9)).toBe(25); // octubre
    });

    it('sin fecha de alta no revienta: congela hasta 24 meses atrás', () => {
        const prev = student({ enrollmentDate: '' as any, monthlyFee: 14 });
        const next = student({ enrollmentDate: '' as any, monthlyFee: 25 });
        const result = freezePastFees(prev, next, DEC)!;
        expect(Object.keys(result).length).toBeLessThanOrEqual(24);
        expect(result['2026-10']).toBe(14);
    });
});

describe('conciliación: pagos existentes', () => {
    const payments = [
        pay('a', '2026-10-03', 14), pay('b', '2026-10-20', 11, { paymentMethod: 'Domiciliación' as any }),
        pay('c', '2026-09-03', 14), pay('d', '2026-10-05', 99, { deletedAt: '2026-10-06' }), pay('e', '2026-10-05', 5, { studentId: 's2' }),
    ];

    it('encuentra los pagos de la alumna en ese mes, sin papelera ni de otras', () => {
        const found = existingPaymentsForMonth(payments, 's1', '2026-10');
        expect(found.map(p => p.id)).toEqual(['a', 'b']);
        expect(sumPayments(found)).toBe(25);
    });

    it('calcula el total resultante al añadir o al sustituir', () => {
        const found = existingPaymentsForMonth(payments, 's1', '2026-10');
        expect(resultingMonthTotal(found, 14, 'add')).toBe(39);
        expect(resultingMonthTotal(found, 14, 'replace')).toBe(14);
        expect(resultingMonthTotal([], 14, 'add')).toBe(14);
    });

    it('lista los pagos a sustituir sin repetidos y solo de las filas marcadas', () => {
        const found = existingPaymentsForMonth(payments, 's1', '2026-10');
        const ids = paymentIdsToReplace([
            { include: true, selectedStudentId: 's1', duplicateMode: 'replace', existing: found },
            { include: true, selectedStudentId: 's1', duplicateMode: 'replace', existing: found }, // segunda fila del banco, misma alumna
            { include: true, selectedStudentId: 's2', duplicateMode: 'add', existing: [payments[4]] },
            { include: false, selectedStudentId: 's3', duplicateMode: 'replace', existing: [payments[2]] },
        ]);
        expect(ids.sort()).toEqual(['a', 'b']);
    });
});
