import React, { useState, useMemo } from 'react';
import { Student, Instructor, DanceClass, Payment, Cost, PaymentMethod, ClassCategory, DayOfWeek, CostCategory, CostPaymentMethod, MerchandiseItem } from '../../types';
import { generateFullBackupZip } from '../utils/csvExportUtils';
import jsPDF from 'jspdf';

interface DataManagementProps {
    students: Student[];
    instructors: Instructor[];
    classes: DanceClass[];
    merchandiseItems: MerchandiseItem[];
    payments: Payment[];
    costs: Cost[];
    batchAddStudents: (students: Omit<Student, 'id'>[]) => Promise<void>;
    batchAddInstructors: (instructors: Omit<Instructor, 'id'>[]) => Promise<void>;
    batchAddClasses: (classes: Omit<DanceClass, 'id'>[]) => Promise<void>;
    batchAddPayments: (payments: Omit<Payment, 'id'>[]) => Promise<void>;
    batchAddCosts: (costs: Omit<Cost, 'id'>[]) => Promise<void>;
    batchAddMerchandiseItems: (items: Omit<MerchandiseItem, 'id'>[]) => Promise<void>;
}

const ImporterSection: React.FC<{
    title: string;
    templateHeaders: string[];
    onImport: (data: string[][]) => Promise<void>;
}> = ({ title, templateHeaders, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFile(event.target.files ? event.target.files[0] : null);
        setError('');
        setSuccess('');
    };

    const handleDownloadTemplate = () => {
        const headersForFile = templateHeaders.map(h => h.split('(')[0].trim());
        const csvContent = headersForFile.join(';') + '\n';
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        link.href = URL.createObjectURL(blob);
        link.download = `${title.toLowerCase().replace(/ /g, '_').replace(/[\(\)]/g, '')}_plantilla.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async () => {
        if (!file) {
            setError('Por favor, selecciona un archivo.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length <= 1) { // Header only or empty
                    throw new Error('El archivo CSV está vacío o solo contiene la cabecera.');
                }

                const rawHeaders = lines.shift()!.split(';').map(h => h.trim().replace(/"/g, ''));
                rawHeaders[0] = rawHeaders[0].replace(/^\uFEFF/, ''); // Remove BOM from first header if present

                const expectedHeaders = templateHeaders.map(h => h.split('(')[0].trim());

                if (JSON.stringify(rawHeaders) !== JSON.stringify(expectedHeaders)) {
                    console.error('Cabeceras esperadas:', expectedHeaders);
                    console.error('Cabeceras recibidas:', rawHeaders);
                    throw new Error('Las cabeceras del CSV no coinciden con la plantilla.');
                }

                const data = lines.map(line => line.split(';').map(item => item.trim().replace(/"/g, '')));
                await onImport(data);
                setSuccess(`¡Se han importado ${data.length} registros de ${title.toLowerCase()} correctamente!`);
                setFile(null);
                if (document.getElementById('file-input-' + title)) {
                    (document.getElementById('file-input-' + title) as HTMLInputElement).value = '';
                }
            } catch (err: any) {
                setError(`Error al importar: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setError('Error al leer el archivo.');
            setIsLoading(false);
        };
        reader.readAsText(file, 'UTF-8');
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
            <p className="text-sm text-gray-400 mb-4">
                Descarga la plantilla, rellena los datos y súbela para importar masivamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleDownloadTemplate} className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500">
                    Descargar Plantilla
                </button>
                <div className="flex-grow">
                    <input
                        id={'file-input-' + title}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                    />
                </div>
                <button onClick={handleImport} disabled={!file || isLoading} className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                    {isLoading ? 'Importando...' : 'Importar'}
                </button>
            </div>
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
            {success && <p className="text-green-400 mt-2 text-sm">{success}</p>}
        </div>
    );
};


const DataManagement: React.FC<DataManagementProps> = ({
    students, instructors, classes, merchandiseItems, payments, costs, batchAddStudents, batchAddInstructors, batchAddClasses, batchAddPayments, batchAddCosts, batchAddMerchandiseItems
}) => {
    const today = new Date();
    const [selectedReportMonth, setSelectedReportMonth] = useState(today.getMonth());
    const [selectedReportYear, setSelectedReportYear] = useState(today.getFullYear());
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const convertDateToISO = (dateStr: string): string => {
        if (!dateStr || !/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
            // Allow empty dates if field is optional in some contexts, but here we expect ISO format conversion 
            // If empty string comes in and it's optional, handle it outside or return empty string?
            // Current logic throws error, which is safer for required fields.
            // For optional fields, we check before calling this function.
            throw new Error(`Formato de fecha inválido: "${dateStr}". Se esperaba DD-MM-YYYY.`);
        }
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    // --- Opciones para las plantillas ---
    const paymentMethodOptions = ['Efectivo', 'Transferencia', 'Domiciliación', 'Bizum'].join(' | ');
    const costPaymentMethodOptions = ['Efectivo', 'Transferencia', 'Domiciliación', 'Tarjeta'].join(' | ');
    const classCategoryOptions = ['Fitness', 'Baile Moderno', 'Competición', 'Especializada'].join(' | ');
    const dayOfWeekOptions = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].join(' | ');
    const costCategoryOptions = ['Profesores', 'Alquiler', 'Suministros', 'Licencias', 'Marketing', 'Mantenimiento', 'Otros'].join(' | ');
    const booleanOptions = 'true | false';

    // --- Cabeceras de las plantillas con ayudas ---
    const studentHeaders = [
        'Nombre Completo',
        'DNI',
        'Fecha de Alta (formato: DD-MM-YYYY)',
        'Fecha de Nacimiento (formato: DD-MM-YYYY)',
        'Teléfono',
        'Email',
        'Cuota Mensual (número)',
        `Forma de Pago (opciones: ${paymentMethodOptions})`,
        'IBAN',
        `Activo (opciones: ${booleanOptions})`,
        'Observaciones',
        classes.length > 20
            ? 'Clases Inscritas (nombres, separar con ;)'
            : `Clases Inscritas (nombres, separar con ;) (Opciones: ${classes.map(c => c.name).join(' | ')})`
    ];
    const instructorHeaders = [
        'Nombre Completo',
        'Email',
        'Teléfono',
        'Tarifa por Clase (número)',
        `Activo (opciones: ${booleanOptions})`,
        'Fecha de Alta (formato: DD-MM-YYYY)',
        'Observaciones'
    ];
    const classHeaders = [
        'Nombre de la Clase',
        instructors.length > 20
            ? 'Nombre del Profesor'
            : `Nombre del Profesor (Opciones: ${instructors.map(i => i.name).join(' | ')})`,
        `Categoría (opciones: ${classCategoryOptions})`,
        `Días (opciones: ${dayOfWeekOptions}; separar con ;)`,
        'Hora Inicio (formato: HH:MM)',
        'Hora Fin (formato: HH:MM)',
        'Capacidad (número)',
        'Tarifa Base (número)'
    ];
    const paymentHeaders = [
        students.length > 20
            ? 'Nombre del Alumno'
            : `Nombre del Alumno (Opciones: ${students.map(s => s.name).join(' | ')})`,
        'Importe (número)',
        'Fecha (formato: DD-MM-YYYY)',
        'Concepto',
        `Forma de Pago (opciones: ${paymentMethodOptions})`,
        'Observaciones'
    ];
    const costHeaders = [
        'Fecha de Pago (formato: DD-MM-YYYY)',
        `Categoría (opciones: ${costCategoryOptions})`,
        'Beneficiario',
        'Concepto',
        'Importe (número)',
        `Forma de Pago (opciones: ${costPaymentMethodOptions})`,
        `Recurrente (opciones: ${booleanOptions})`,
        'Observaciones'
    ];
    const merchandiseHeaders = [
        'Nombre',
        'Categoría',
        'Talla',
        'Precio Compra (€)',
        'Precio Venta (€)',
        'Stock Inicial (número)',
        'URL Imagen (opcional)',
        'Observaciones',
    ];

    // --- Lógica de importación ---
    const handleStudentImport = async (data: string[][]) => {
        const newStudents: Omit<Student, 'id'>[] = data.map(row => {
            const classNames = row[11] ? row[11].split(';').map(s => s.trim()) : [];
            const enrolledClassIds = classNames
                .map(name => classes.find(c => c.name === name)?.id)
                .filter((id): id is string => !!id);
            return {
                name: row[0],
                dni: row[1],
                enrollmentDate: convertDateToISO(row[2]),
                birthDate: row[3] ? convertDateToISO(row[3]) : undefined,
                phone: row[4],
                email: row[5],
                monthlyFee: parseFloat(row[6]) || 0,
                paymentMethod: row[7] as PaymentMethod,
                iban: row[8],
                active: row[9].toLowerCase() === 'true',
                notes: row[10],
                enrolledClassIds: enrolledClassIds,
            };
        });
        await batchAddStudents(newStudents);
    };

    const handleInstructorImport = async (data: string[][]) => {
        const newInstructors: Omit<Instructor, 'id'>[] = data.map(row => ({
            name: row[0],
            email: row[1],
            phone: row[2],
            ratePerClass: parseFloat(row[3]) || 0,
            active: row[4].toLowerCase() === 'true',
            hireDate: convertDateToISO(row[5]),
            notes: row[6],
        }));
        await batchAddInstructors(newInstructors);
    };

    const handleClassImport = async (data: string[][]) => {
        const newClasses: Omit<DanceClass, 'id'>[] = data.map(row => {
            const instructor = instructors.find(i => i.name === row[1]);
            if (!instructor) throw new Error(`Profesor "${row[1]}" no encontrado para la clase "${row[0]}".`);
            return {
                name: row[0], instructorId: instructor.id, category: row[2] as ClassCategory,
                days: row[3] ? row[3].split(';').map(d => d.trim() as DayOfWeek) : [],
                startTime: row[4], endTime: row[5],
                capacity: parseInt(row[6], 10) || 0,
                baseRate: parseFloat(row[7]) || 0,
            };
        });
        await batchAddClasses(newClasses);
    };

    const handlePaymentImport = async (data: string[][]) => {
        const newPayments: Omit<Payment, 'id'>[] = data.map(row => {
            const student = students.find(s => s.name === row[0]);
            if (!student) throw new Error(`Alumno "${row[0]}" no encontrado.`);
            return {
                studentId: student.id,
                amount: parseFloat(row[1]) || 0,
                date: convertDateToISO(row[2]), concept: row[3],
                paymentMethod: row[4] as PaymentMethod,
                notes: row[5],
            };
        });
        await batchAddPayments(newPayments);
    };

    const handleCostImport = async (data: string[][]) => {
        const newCosts: Omit<Cost, 'id'>[] = data.map(row => ({
            paymentDate: convertDateToISO(row[0]), category: row[1] as CostCategory,
            beneficiary: row[2], concept: row[3],
            amount: parseFloat(row[4]) || 0,
            paymentMethod: row[5] as CostPaymentMethod,
            isRecurring: row[6].toLowerCase() === 'true',
            notes: row[7],
        }));
        await batchAddCosts(newCosts);
    };

    const handleMerchandiseImport = async (data: string[][]) => {
        const newItems: Omit<MerchandiseItem, 'id'>[] = data.map(row => ({
            name: row[0],
            category: row[1],
            size: row[2],
            purchasePrice: parseFloat(row[3]) || 0,
            salePrice: parseFloat(row[4]) || 0,
            stock: parseInt(row[5], 10) || 0,
            imageUrl: row[6],
            notes: row[7],
        }));
        await batchAddMerchandiseItems(newItems);
    };

    // PDF Report Generation Function
    const generateMonthlyFinancialReport = () => {
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPos = 20;

        // Helper: Get active students for selected month
        const getActiveStudentsForMonth = (classId: string) => {
            return students.filter(s => {
                if (!s.enrolledClassIds.includes(classId)) return false;
                if (s.enrollmentDate) {
                    const enrollDate = new Date(s.enrollmentDate);
                    const selectedDate = new Date(selectedReportYear, selectedReportMonth, 1);
                    if (enrollDate > selectedDate) return false;
                }
                if (s.deactivationDate) {
                    const deactivDate = new Date(s.deactivationDate);
                    const selectedDate = new Date(selectedReportYear, selectedReportMonth, 1);
                    if (deactivDate < selectedDate) return false;
                }
                return true;
            });
        };

        // Calculate metrics for selected month
        const monthPayments = payments.filter(p => {
            const d = new Date(p.date);
            return d.getMonth() === selectedReportMonth && d.getFullYear() === selectedReportYear;
        });
        const monthCosts = costs.filter(c => {
            const d = new Date(c.paymentDate);
            return d.getMonth() === selectedReportMonth && d.getFullYear() === selectedReportYear;
        });

        const totalRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalCosts = monthCosts.reduce((sum, c) => sum + c.amount, 0);
        const netProfit = totalRevenue - totalCosts;
        const roi = totalCosts > 0 ? ((netProfit / totalCosts) * 100).toFixed(1) : '0';

        const activeStudentsCount = students.filter(s => {
            const enrollDate = new Date(s.enrollmentDate);
            const selectedDate = new Date(selectedReportYear, selectedReportMonth, 1);
            if (enrollDate > selectedDate) return false;
            if (s.deactivationDate) {
                const deactivDate = new Date(s.deactivationDate);
                if (deactivDate < selectedDate) return false;
            }
            return true;
        }).length;

        // Header
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Reporte Financiero Mensual', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${monthNames[selectedReportMonth]} ${selectedReportYear}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Summary Section
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Resumen Ejecutivo', 14, yPos);
        yPos += 8;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Ingresos Totales: ${totalRevenue.toFixed(2)}€`, 14, yPos);
        yPos += 6;
        pdf.text(`Gastos Totales: ${totalCosts.toFixed(2)}€`, 14, yPos);
        yPos += 6;
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Beneficio Neto: ${netProfit.toFixed(2)}€`, 14, yPos);
        yPos += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`ROI: ${roi}%`, 14, yPos);
        yPos += 6;
        pdf.text(`Alumnos Activos: ${activeStudentsCount}`, 14, yPos);
        yPos += 12;

        // Revenue Breakdown
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Desglose de Ingresos por Método de Pago', 14, yPos);
        yPos += 8;
        const paymentMethodBreakdown = monthPayments.reduce((acc, p) => {
            acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        Object.entries(paymentMethodBreakdown).forEach(([method, amount]: [string, number]) => {
            pdf.text(`${method}: ${amount.toFixed(2)}€`, 20, yPos);
            yPos += 6;
        });
        yPos += 6;

        // Cost Breakdown
        if (yPos > pageHeight - 60) {
            pdf.addPage();
            yPos = 20;
        }
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Desglose de Gastos por Categoría', 14, yPos);
        yPos += 8;
        const costCategoryBreakdown = monthCosts.reduce((acc, c) => {
            acc[c.category] = (acc[c.category] || 0) + c.amount;
            return acc;
        }, {} as Record<string, number>);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        Object.entries(costCategoryBreakdown).forEach(([category, amount]: [string, number]) => {
            pdf.text(`${category}: ${amount.toFixed(2)}€`, 20, yPos);
            yPos += 6;
        });
        yPos += 6;

        // Profitability by Instructor (Top 5)
        if (yPos > pageHeight - 60) {
            pdf.addPage();
            yPos = 20;
        }
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Rentabilidad por Profesor (Top 5)', 14, yPos);
        yPos += 8;
        const instructorProfitability = instructors.map(instructor => {
            let totalRevenue = 0;
            let totalCost = 0;
            const instructorClasses = classes.filter(c => c.instructorId === instructor.id);
            instructorClasses.forEach(cls => {
                const activeStudents = getActiveStudentsForMonth(cls.id);
                const avgPrice = activeStudents.length > 0
                    ? activeStudents.reduce((sum, s) => sum + (s.monthlyFee / s.enrolledClassIds.length), 0) / activeStudents.length
                    : 0;
                totalRevenue += avgPrice * activeStudents.length;
            });
            const instructorMonthCosts = monthCosts.filter(c => c.relatedInstructorId === instructor.id);
            totalCost = instructorMonthCosts.reduce((sum, c) => sum + c.amount, 0);
            return { name: instructor.name, profit: totalRevenue - totalCost };
        }).sort((a, b) => b.profit - a.profit).slice(0, 5);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        instructorProfitability.forEach(({ name, profit }) => {
            pdf.text(`${name}: ${profit.toFixed(2)}€`, 20, yPos);
            yPos += 6;
        });
        yPos += 6;

        // Footer
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Save PDF
        pdf.save(`Reporte_Financiero_${monthNames[selectedReportMonth]}_${selectedReportYear}.pdf`);
    };

    return (
        <div className="p-4 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold">Gestión de Datos</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => generateFullBackupZip({ students, instructors, classes, payments, costs, merchandiseItems })}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-900/30 transition-all active:scale-95"
                        title="Descarga todos los datos en un archivo ZIP con archivos CSV compatibles con el importador"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        Exportar Backup Completo (ZIP)
                    </button>
                    <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-xl">
                        <select
                            value={selectedReportMonth}
                            onChange={(e) => setSelectedReportMonth(parseInt(e.target.value))}
                            className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-bold"
                        >
                            {monthNames.map((month, idx) => (
                                <option key={idx} value={idx}>{month}</option>
                            ))}
                        </select>
                        <select
                            value={selectedReportYear}
                            onChange={(e) => setSelectedReportYear(parseInt(e.target.value))}
                            className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-bold"
                        >
                            {[2023, 2024, 2025, 2026, 2027].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <button
                            onClick={generateMonthlyFinancialReport}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-900/30 transition-all active:scale-95"
                            title="Genera un reporte financiero en PDF para el mes seleccionado"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            Generar Reporte PDF
                        </button>
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                <ImporterSection title="Alumnos" templateHeaders={studentHeaders} onImport={handleStudentImport} />
                <ImporterSection title="Profesores" templateHeaders={instructorHeaders} onImport={handleInstructorImport} />
                <ImporterSection title="Clases" templateHeaders={classHeaders} onImport={handleClassImport} />
                <ImporterSection title="Ingresos (Cobros)" templateHeaders={paymentHeaders} onImport={handlePaymentImport} />
                <ImporterSection title="Costes (Gastos)" templateHeaders={costHeaders} onImport={handleCostImport} />
                <ImporterSection title="Merchandising" templateHeaders={merchandiseHeaders} onImport={handleMerchandiseImport} />
            </div>
        </div>
    );
};

export default DataManagement;
