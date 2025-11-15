import React, { useState } from 'react';
import { Student, Instructor, DanceClass, Payment, Cost, PaymentMethod, Specialty, ClassCategory, DayOfWeek, CostCategory, CostPaymentMethod } from '../types';

interface DataManagementProps {
    students: Student[];
    instructors: Instructor[];
    classes: DanceClass[];
    batchAddStudents: (students: Omit<Student, 'id'>[]) => Promise<void>;
    batchAddInstructors: (instructors: Omit<Instructor, 'id'>[]) => Promise<void>;
    batchAddClasses: (classes: Omit<DanceClass, 'id'>[]) => Promise<void>;
    batchAddPayments: (payments: Omit<Payment, 'id'>[]) => Promise<void>;
    batchAddCosts: (costs: Omit<Cost, 'id'>[]) => Promise<void>;
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
    students, instructors, classes, batchAddStudents, batchAddInstructors, batchAddClasses, batchAddPayments, batchAddCosts
}) => {
    
    const convertDateToISO = (dateStr: string): string => {
        if (!dateStr || !/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
            throw new Error(`Formato de fecha inválido: "${dateStr}". Se esperaba DD-MM-YYYY.`);
        }
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    // --- Opciones para las plantillas ---
    const paymentMethodOptions = ['Efectivo', 'Transferencia', 'Domiciliación', 'Bizum'].join(' | ');
    const costPaymentMethodOptions = ['Efectivo', 'Transferencia', 'Domiciliación', 'Tarjeta'].join(' | ');
    const specialtyOptions = ['Fitness', 'Baile Moderno', 'Hip Hop', 'Pilates', 'Zumba', 'Competición', 'Contemporáneo', 'Ballet'].join(' | ');
    const classCategoryOptions = ['Fitness', 'Baile Moderno', 'Competición', 'Especializada'].join(' | ');
    const dayOfWeekOptions = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].join(' | ');
    const costCategoryOptions = ['Profesores', 'Alquiler', 'Suministros', 'Licencias', 'Marketing', 'Mantenimiento', 'Otros'].join(' | ');
    const booleanOptions = 'true | false';

    // --- Cabeceras de las plantillas con ayudas ---
    const studentHeaders = [
        'Nombre Completo',
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
        `Especialidades (opciones: ${specialtyOptions}; separar con ;)`,
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

    // --- Lógica de importación ---
    const handleStudentImport = async (data: string[][]) => {
        const newStudents: Omit<Student, 'id'>[] = data.map(row => {
            const classNames = row[9] ? row[9].split(';').map(s => s.trim()) : [];
            const enrolledClassIds = classNames
                .map(name => classes.find(c => c.name === name)?.id)
                .filter((id): id is string => !!id);
            return {
                name: row[0], birthDate: convertDateToISO(row[1]), phone: row[2], email: row[3],
                monthlyFee: parseFloat(row[4]) || 0,
                paymentMethod: row[5] as PaymentMethod,
                iban: row[6], active: row[7].toLowerCase() === 'true', notes: row[8],
                enrolledClassIds: enrolledClassIds,
            };
        });
        await batchAddStudents(newStudents);
    };

    const handleInstructorImport = async (data: string[][]) => {
        const newInstructors: Omit<Instructor, 'id'>[] = data.map(row => ({
            name: row[0], email: row[1], phone: row[2],
            specialties: row[3] ? row[3].split(';').map(s => s.trim() as Specialty) : [],
            ratePerClass: parseFloat(row[4]) || 0,
            active: row[5].toLowerCase() === 'true',
            hireDate: convertDateToISO(row[6]), notes: row[7],
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

    return (
        <div className="p-4 sm:p-8 space-y-8">
            <h2 className="text-3xl font-bold">Gestión de Datos</h2>
            <div className="space-y-6">
                <ImporterSection title="Alumnos" templateHeaders={studentHeaders} onImport={handleStudentImport} />
                <ImporterSection title="Profesores" templateHeaders={instructorHeaders} onImport={handleInstructorImport} />
                <ImporterSection title="Clases" templateHeaders={classHeaders} onImport={handleClassImport} />
                <ImporterSection title="Ingresos (Cobros)" templateHeaders={paymentHeaders} onImport={handlePaymentImport} />
                <ImporterSection title="Costes (Gastos)" templateHeaders={costHeaders} onImport={handleCostImport} />
            </div>
        </div>
    );
};

export default DataManagement;
