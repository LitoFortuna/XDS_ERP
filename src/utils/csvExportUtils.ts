
import { Payment, Cost, Student } from '../../types';

/**
 * Formats a date string (YYYY-MM-DD) to the Spanish format (DD-MM-YYYY)
 */
const formatDateForCSV = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
};

/**
 * Triggers a localized browser download for a CSV blob
 */
export const downloadCSV = (filename: string, csvContent: string) => {
    // Add BOM for better Excel compatibility with UTF-8
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Converts a list of payments to a CSV string following the import template
 */
export const exportPaymentsToCSV = (payments: Payment[], students: Student[]): string => {
    const headers = [
        'Nombre del Alumno',
        'Importe',
        'Fecha',
        'Concepto',
        'Forma de Pago',
        'Observaciones'
    ];

    const rows = payments.map(p => {
        const student = students.find(s => s.id === p.studentId);
        return [
            student ? student.name : 'Alumno Desconocido',
            p.amount.toString().replace('.', ','), // Match Spanish number format if needed? DataManagement uses parseFloat so '.' is safer, but user might want ',' for Excel. 
            // Actually, DataManagement.tsx:parseFloat(row[1]) - parseFloat works better with . but Excel likes ,
            // Let's stick to '.' as it's more standard for parsing code, or follow what the user might expect.
            // DataManagement uses parseFloat(row[x]), which in JS expects '.'
            p.amount,
            formatDateForCSV(p.date),
            p.concept,
            p.paymentMethod,
            p.notes || ''
        ];
    });

    return [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
};

/**
 * Converts a list of costs to a CSV string following the import template
 */
export const exportCostsToCSV = (costs: Cost[]): string => {
    const headers = [
        'Fecha de Pago',
        'Categoría',
        'Beneficiario',
        'Concepto',
        'Importe',
        'Forma de Pago',
        'Recurrente',
        'Observaciones'
    ];

    const rows = costs.map(c => [
        formatDateForCSV(c.paymentDate),
        c.category,
        c.beneficiary,
        c.concept,
        c.amount,
        c.paymentMethod,
        c.isRecurring ? 'true' : 'false',
        c.notes || ''
    ]);

    return [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
};
