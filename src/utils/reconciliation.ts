import { Payment } from '../../types';

export type DuplicateMode = 'add' | 'replace';

// Pagos que una alumna ya tiene registrados en un mes (monthKey = "YYYY-MM"), sin contar los que
// están en la Papelera.
export const existingPaymentsForMonth = (payments: Payment[], studentId: string, monthKey: string): Payment[] =>
    payments.filter(p => p.studentId === studentId && !p.deletedAt && (p.date || '').startsWith(monthKey));

const round2 = (n: number) => Math.round(n * 100) / 100;

export const sumPayments = (payments: Payment[]): number => round2(payments.reduce((sum, p) => sum + p.amount, 0));

// Importe total del mes tras registrar la domiciliación: sumándola a lo que ya hay, o sustituyéndolo.
export const resultingMonthTotal = (existing: Payment[], bankAmount: number, mode: DuplicateMode): number =>
    mode === 'add' ? round2(sumPayments(existing) + bankAmount) : round2(bankAmount);

// Ids de los pagos existentes que hay que retirar (a la Papelera) para las filas marcadas como
// "sustituir"; sin repetidos aunque varias filas del banco sean de la misma alumna.
export const paymentIdsToReplace = (
    rows: Array<{ include: boolean; selectedStudentId: string | null; duplicateMode: DuplicateMode; existing: Payment[] }>
): string[] =>
    [...new Set(rows
        .filter(r => r.include && r.selectedStudentId && r.duplicateMode === 'replace')
        .flatMap(r => r.existing.map(p => p.id)))];
