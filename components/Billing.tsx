
import React, { useState, useMemo, useEffect } from 'react';
import { Payment, Student, PaymentMethod, Cost, CostCategory, CostPaymentMethod, DanceClass, MerchandiseSale, Instructor } from '../types';
import Modal from './Modal';
import { StudentForm } from './StudentList';
import { useAppStore } from '../src/store/useAppStore';
import { useAppActions } from '../src/hooks/useAppActions';


/**
 * Formateador de moneda robusto que garantiza el formato 12.056€
 */
const formatCurrency = (v: number, decimals: number = 2) => {
    const parts = v.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(',') + '€';
};

// --- COMPONENTE MODAL DE GESTIÓN MENSUAL ---
interface MonthlyDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    monthIndex: number;
    year: number;
    payments: Payment[];
    onUpdateStudent: (student: Student) => void;
    onAddPayment: (payment: Omit<Payment, 'id'>) => void;
    onUpdatePayment: (payment: Payment) => void;
    onDeletePayment: (id: string) => void;
    onNavigateMonth: (direction: 'prev' | 'next') => void;
}

const MonthlyDetailModal: React.FC<MonthlyDetailModalProps> = ({
    isOpen, onClose, student, monthIndex, year, payments, onUpdateStudent, onAddPayment, onUpdatePayment, onDeletePayment, onNavigateMonth
}) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = months[monthIndex];
    const exceptionKey = `${year}-${monthIndex}`;

    const currentMonthFee = student.feeExceptions?.[exceptionKey] !== undefined
        ? student.feeExceptions[exceptionKey]
        : student.monthlyFee;

    const [monthSpecificFee, setMonthSpecificFee] = useState(currentMonthFee);
    const [isFeeDirty, setIsFeeDirty] = useState(false);

    const [newPayment, setNewPayment] = useState({
        amount: 0,
        date: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
        method: student.paymentMethod as PaymentMethod,
        concept: `Cuota ${monthName}`
    });

    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [editPaymentData, setEditPaymentData] = useState<Partial<Payment>>({});

    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const remaining = monthSpecificFee - totalPaid;

    useEffect(() => {
        if (isOpen) {
            const feeForThisMonth = student.feeExceptions?.[`${year}-${monthIndex}`] !== undefined
                ? student.feeExceptions[`${year}-${monthIndex}`]
                : student.monthlyFee;

            setMonthSpecificFee(feeForThisMonth);

            const currentTotalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
            setNewPayment(prev => ({
                ...prev,
                date: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
                concept: `Cuota ${months[monthIndex]}`,
                amount: Math.max(0, feeForThisMonth - currentTotalPaid)
            }));
            setIsFeeDirty(false);
        }
    }, [isOpen, student, year, monthIndex, payments]);

    if (!isOpen) return null;

    const handleSaveSpecificFee = () => {
        const updatedExceptions = { ...student.feeExceptions };
        if (monthSpecificFee === student.monthlyFee) {
            delete updatedExceptions[exceptionKey];
        } else {
            updatedExceptions[exceptionKey] = monthSpecificFee;
        }
        onUpdateStudent({ ...student, feeExceptions: updatedExceptions });
        setIsFeeDirty(false);
    };

    const handleAddPaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddPayment({
            studentId: student.id,
            amount: newPayment.amount,
            date: newPayment.date,
            paymentMethod: newPayment.method,
            concept: newPayment.concept,
            notes: ''
        });
        setNewPayment(prev => ({ ...prev, amount: 0 }));
    };

    const startEditPayment = (payment: Payment) => {
        setEditingPaymentId(payment.id);
        setEditPaymentData(payment);
    };

    const saveEditPayment = () => {
        if (editingPaymentId && editPaymentData) {
            onUpdatePayment(editPaymentData as Payment);
            setEditingPaymentId(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gestión: ${student.name}`}>
            <div className="space-y-6">
                <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                    <button
                        onClick={() => onNavigateMonth('prev')}
                        className="p-2 hover:bg-gray-600 rounded-full text-gray-400 hover:text-white transition-colors"
                        title="Mes Anterior"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">{monthName} {year}</h3>
                    <button
                        onClick={() => onNavigateMonth('next')}
                        className="p-2 hover:bg-gray-600 rounded-full text-gray-400 hover:text-white transition-colors"
                        title="Mes Siguiente"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Importe Esperado ({monthName})</h4>
                        <span className="text-xs text-gray-500">Cuota Global: {formatCurrency(student.monthlyFee)}</span>
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">
                                {student.feeExceptions?.[exceptionKey] !== undefined
                                    ? "Importe modificado para este mes"
                                    : "Usando cuota estándar"}
                            </label>
                            <input
                                type="number"
                                value={monthSpecificFee}
                                onChange={(e) => {
                                    setMonthSpecificFee(parseFloat(e.target.value) || 0);
                                    setIsFeeDirty(true);
                                }}
                                className={`block w-full bg-gray-800 border rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 font-mono text-lg
                                    ${monthSpecificFee !== student.monthlyFee ? 'border-purple-500/50 text-purple-300' : 'border-gray-600'}
                                `}
                            />
                        </div>
                        <button
                            onClick={handleSaveSpecificFee}
                            disabled={!isFeeDirty}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
                        >
                            Guardar Importe
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Define cuánto debe pagar el alumno <strong className="text-white">solo en este mes</strong>. Pon "0" si está exento.
                    </p>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide flex justify-between items-center">
                        <span>Pagos Realizados</span>
                        <span className={`text-lg font-bold ${totalPaid >= monthSpecificFee ? 'text-green-400' : 'text-orange-400'}`}>
                            Total: {formatCurrency(totalPaid)}
                        </span>
                    </h4>

                    <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                        {payments.length > 0 ? (
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="bg-gray-800 text-xs text-gray-300 uppercase">
                                    <tr>
                                        <th className="px-4 py-2">Fecha</th>
                                        <th className="px-4 py-2">Método</th>
                                        <th className="px-4 py-2">Importe</th>
                                        <th className="px-4 py-2 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {payments.map(payment => (
                                        <tr key={payment.id} className="hover:bg-gray-800/50">
                                            {editingPaymentId === payment.id ? (
                                                <>
                                                    <td className="px-2 py-2">
                                                        <input type="date" value={editPaymentData.date} onChange={e => setEditPaymentData({ ...editPaymentData, date: e.target.value })} className="w-full bg-gray-700 border-gray-600 rounded text-xs px-2 py-1 text-white" />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <select value={editPaymentData.paymentMethod} onChange={e => setEditPaymentData({ ...editPaymentData, paymentMethod: e.target.value as PaymentMethod })} className="w-full bg-gray-700 border-gray-600 rounded text-xs px-2 py-1 text-white">
                                                            <option>Efectivo</option><option>Transferencia</option><option>Domiciliación</option><option>Bizum</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input type="number" value={editPaymentData.amount} onChange={e => setEditPaymentData({ ...editPaymentData, amount: parseFloat(e.target.value) })} className="w-24 bg-gray-700 border-gray-600 rounded text-xs px-2 py-1 text-white" />
                                                    </td>
                                                    <td className="px-2 py-2 text-right space-x-1">
                                                        <button onClick={saveEditPayment} className="text-green-400 hover:text-green-300 text-xs">Guardar</button>
                                                        <button onClick={() => setEditingPaymentId(null)} className="text-gray-400 hover:text-gray-300 text-xs">Cancelar</button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3">{new Date(payment.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3">{payment.paymentMethod}</td>
                                                    <td className="px-4 py-3 text-white font-medium">{formatCurrency(payment.amount)}</td>
                                                    <td className="px-4 py-3 text-right space-x-2">
                                                        <button onClick={() => startEditPayment(payment)} className="text-purple-400 hover:text-purple-300 text-xs">Editar</button>
                                                        <button onClick={() => { if (window.confirm('¿Borrar pago?')) onDeletePayment(payment.id) }} className="text-red-400 hover:text-red-300 text-xs">Borrar</button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="p-4 text-center text-gray-500 italic">No hay pagos registrados para este mes.</p>
                        )}
                    </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 border-dashed">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Registrar Nuevo Pago</h4>
                    <form onSubmit={handleAddPaymentSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div className="sm:col-span-1">
                            <label className="block text-xs text-gray-400 mb-1">Fecha</label>
                            <input type="date" value={newPayment.date} onChange={e => setNewPayment({ ...newPayment, date: e.target.value })} className="w-full bg-gray-800 border-gray-600 rounded-md text-sm px-3 py-2 text-white focus:ring-purple-500" required />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs text-gray-400 mb-1">Importe (€)</label>
                            <input type="number" step="0.01" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })} className="w-full bg-gray-800 border-gray-600 rounded-md text-sm px-3 py-2 text-white focus:ring-purple-500" required />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs text-gray-400 mb-1">Método</label>
                            <select value={newPayment.method} onChange={e => setNewPayment({ ...newPayment, method: e.target.value as PaymentMethod })} className="w-full bg-gray-800 border-gray-600 rounded-md text-sm px-3 py-2 text-white focus:ring-purple-500">
                                <option>Efectivo</option><option>Transferencia</option><option>Domiciliación</option><option>Bizum</option>
                            </select>
                        </div>
                        <div className="sm:col-span-1">
                            <button type="submit" className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm font-medium">
                                + Añadir
                            </button>
                        </div>
                    </form>
                    {remaining > 0 && (
                        <p className="text-xs text-gray-400 mt-2 text-right">Faltan <span className="text-orange-400 font-bold">{formatCurrency(remaining)}</span> para completar la cuota.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

// --- FORMULARIO DE COBROS (INGRESOS) ---
export const PaymentForm: React.FC<{
    students: Student[];
    onSubmit: (payment: Omit<Payment, 'id'>) => void;
    onCancel: () => void;
    initialValues?: Partial<Omit<Payment, 'id'>>;
}> = ({ students, onSubmit, onCancel, initialValues }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        studentId: '',
        concept: 'Cuota Mensual',
        amount: 0,
        paymentMethod: 'Efectivo' as PaymentMethod,
        notes: '',
    });

    useEffect(() => {
        if (initialValues) {
            setFormData(prev => ({
                ...prev,
                ...initialValues,
                date: initialValues.date || prev.date,
                studentId: initialValues.studentId || prev.studentId,
                concept: initialValues.concept || prev.concept,
                amount: initialValues.amount !== undefined ? initialValues.amount : prev.amount,
                paymentMethod: initialValues.paymentMethod || prev.paymentMethod,
                notes: initialValues.notes || prev.notes
            }));
        }
    }, [initialValues]);

    const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const studentId = e.target.value;
        const student = students.find(s => s.id === studentId);
        setFormData(prev => ({
            ...prev,
            studentId,
            amount: student?.monthlyFee || 0,
            paymentMethod: student?.paymentMethod || 'Efectivo',
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.studentId) {
            alert('Por favor, selecciona un alumno.');
            return;
        }
        onSubmit(formData);
    };

    const sortedStudents = useMemo(() =>
        [...students]
            .filter(s => s.active)
            .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
        [students]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Fecha</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Alumno</label>
                    <select name="studentId" value={formData.studentId} onChange={handleStudentChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required>
                        <option value="" disabled>Selecciona un alumno...</option>
                        {sortedStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Concepto</label>
                    <input type="text" name="concept" value={formData.concept} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Importe (€)</label>
                    <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Forma de Pago</label>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required>
                        <option>Efectivo</option>
                        <option>Transferencia</option>
                        <option>Domiciliación</option>
                        <option>Bizum</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Observaciones</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Registrar Cobro</button>
            </div>
        </form>
    );
};

// --- FORMULARIO DE COSTES (GASTOS) ---
const CostForm: React.FC<{
    cost?: Cost;
    instructors: Instructor[];
    initialValues?: Partial<Cost>;
    onSubmit: (cost: Omit<Cost, 'id'> | Omit<Cost, 'id'>[]) => void;
    onCancel: () => void;
}> = ({ cost, instructors, initialValues, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        paymentDate: cost?.paymentDate || initialValues?.paymentDate || new Date().toISOString().split('T')[0],
        category: cost?.category || initialValues?.category || 'Otros' as CostCategory,
        beneficiary: cost?.beneficiary || initialValues?.beneficiary || '',
        concept: cost?.concept || initialValues?.concept || '',
        amount: cost?.amount || initialValues?.amount || 0,
        paymentMethod: cost?.paymentMethod || initialValues?.paymentMethod || 'Transferencia' as CostPaymentMethod,
        isRecurring: cost?.isRecurring ?? initialValues?.isRecurring ?? false,
        notes: cost?.notes || initialValues?.notes || '',
        relatedInstructorId: cost?.relatedInstructorId || '',
    });

    const [selectedRecurringDates, setSelectedRecurringDates] = useState<Set<string>>(new Set());
    const [futureDates, setFutureDates] = useState<{ date: string, label: string }[]>([]);

    useEffect(() => {
        if (!formData.paymentDate) return;
        try {
            const baseDate = new Date(formData.paymentDate);
            if (isNaN(baseDate.getTime())) return;

            const dates = [];
            for (let i = 1; i <= 11; i++) {
                const nextDate = new Date(baseDate);
                nextDate.setMonth(baseDate.getMonth() + i);
                if (nextDate.getDate() !== baseDate.getDate()) {
                    nextDate.setDate(0);
                }
                const dateStr = nextDate.toISOString().split('T')[0];
                const label = nextDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', day: 'numeric' });
                dates.push({ date: dateStr, label });
            }
            setFutureDates(dates);
            setSelectedRecurringDates(new Set());
        } catch (e) {
            console.error("Error generating dates:", e);
        }
    }, [formData.paymentDate]);

    const toggleRecurringDate = (date: string) => {
        const newSet = new Set(selectedRecurringDates);
        if (newSet.has(date)) {
            newSet.delete(date);
        } else {
            newSet.add(date);
        }
        setSelectedRecurringDates(newSet);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'amount' ? parseFloat(value) : value
            }));
        }
    };

    const handleInstructorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const instructorId = e.target.value;
        const selectedInstructor = (instructors || []).find(i => i.id === instructorId);
        setFormData(prev => ({
            ...prev,
            relatedInstructorId: instructorId,
            beneficiary: selectedInstructor ? selectedInstructor.name : prev.beneficiary
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const baseCost = { ...formData };
        if (cost) {
            onSubmit({ ...cost, ...baseCost });
        } else {
            if (formData.isRecurring && selectedRecurringDates.size > 0) {
                const costsToCreate = [baseCost];
                selectedRecurringDates.forEach(dateStr => {
                    costsToCreate.push({
                        ...baseCost,
                        paymentDate: dateStr
                    });
                });
                onSubmit(costsToCreate);
            } else {
                onSubmit(baseCost);
            }
        }
    };

    const sortedInstructors = useMemo(() =>
        [...(instructors || [])].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
        [instructors]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Fecha de Pago</label>
                    <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Categoría</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                        {(['Profesores', 'Alquiler', 'Suministros', 'Licencias', 'Marketing', 'Mantenimiento', 'Otros'] as CostCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {formData.category === 'Profesores' && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300">Seleccionar Profesor (Vincular)</label>
                        <select
                            name="relatedInstructorId"
                            value={formData.relatedInstructorId}
                            onChange={handleInstructorChange}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">-- Seleccionar Profesor --</option>
                            {sortedInstructors.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Seleccionar un profesor rellenará automáticamente el campo Beneficiario.</p>
                    </div>
                )}

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Proveedor/Beneficiario</label>
                    <input type="text" name="beneficiary" value={formData.beneficiary} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Concepto</label>
                    <input type="text" name="concept" value={formData.concept} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Importe (€)</label>
                    <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Forma de Pago</label>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                        {(['Transferencia', 'Efectivo', 'Domiciliación', 'Tarjeta'] as CostPaymentMethod[]).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Observaciones</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
                </div>
                <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center">
                        <input type="checkbox" name="isRecurring" id="isRecurring" checked={formData.isRecurring} onChange={handleChange} className="h-4 w-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 focus:ring-offset-gray-800" />
                        <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-200">Gasto Recurrente</label>
                    </div>

                    {formData.isRecurring && !cost && (
                        <div className="bg-gray-700/50 p-3 rounded-md border border-gray-600">
                            <p className="text-xs text-gray-300 mb-2 font-semibold">Repetir gasto para los siguientes meses:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {futureDates.map((fd) => (
                                    <label key={fd.date} className="flex items-center space-x-2 text-xs text-gray-400 bg-gray-800/50 p-2 rounded cursor-pointer hover:bg-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={selectedRecurringDates.has(fd.date)}
                                            onChange={() => toggleRecurringDate(fd.date)}
                                            className="rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700"
                                        />
                                        <span className={selectedRecurringDates.has(fd.date) ? "text-purple-300 font-medium" : ""}>
                                            {fd.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const all = new Set(futureDates.map(d => d.date));
                                        setSelectedRecurringDates(all);
                                    }}
                                    className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
                                >
                                    Seleccionar todos
                                </button>
                                <span className="text-xs text-gray-500">
                                    Se crearán {selectedRecurringDates.size + 1} gastos en total.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">{cost ? 'Actualizar' : 'Registrar'} Coste</button>
            </div>
        </form>
    );
};

// --- COMPONENTE PRINCIPAL DE FACTURACIÓN ---
interface BillingProps {
    // Props handled via Zustand
}

const Billing: React.FC<BillingProps> = React.memo(() => {
    const {
        payments,
        costs,
        students,
        classes,
        merchandiseSales,
        instructors
    } = useAppStore();

    const {
        addPayment,
        updatePayment,
        deletePayment,
        addCost,
        updateCost,
        deleteCost,
        updateStudent
    } = useAppActions();

    const [activeTab, setActiveTab] = useState<'income' | 'costs'>('income');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const availableYears = [2024, 2025, 2026, 2027];

    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isCostModalOpen, setIsCostModalOpen] = useState(false);
    const [editingCost, setEditingCost] = useState<Cost | undefined>(undefined);
    const [costToDuplicate, setCostToDuplicate] = useState<Partial<Cost> | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [costSearchQuery, setCostSearchQuery] = useState('');
    const [costCategoryFilter, setCostCategoryFilter] = useState<CostCategory | ''>('');
    const [costStartDate, setCostStartDate] = useState('');
    const [costEndDate, setCostEndDate] = useState('');
    const [selectedMonthCell, setSelectedMonthCell] = useState<{ studentId: string, monthIndex: number, year: number } | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

    // Filtrado por año seleccionado
    const yearPayments = useMemo(() => payments.filter(p => new Date(p.date).getFullYear() === selectedYear), [payments, selectedYear]);
    const yearCosts = useMemo(() => costs.filter(c => new Date(c.paymentDate).getFullYear() === selectedYear), [costs, selectedYear]);

    const totalIncome = yearPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalCosts = yearCosts.reduce((sum, c) => sum + c.amount, 0);

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const currentMonthIndex = new Date().getMonth();
    const realCurrentYear = new Date().getFullYear();

    const getPaymentStatusForMonth = (student: Student, monthIndex: number) => {
        if (student.deactivationDate) {
            const deactivationDate = new Date(student.deactivationDate);
            const deactivationYear = deactivationDate.getFullYear();
            const deactivationMonth = deactivationDate.getMonth();
            if (selectedYear > deactivationYear || (selectedYear === deactivationYear && monthIndex > deactivationMonth)) {
                return { text: '-', color: 'text-gray-600 hover:bg-gray-700 cursor-pointer opacity-50' };
            }
        }
        if (!student.enrollmentDate) return { text: 'N/A', color: 'text-gray-600' };

        const enrollmentDate = new Date(student.enrollmentDate);
        const enrollmentYear = enrollmentDate.getFullYear();
        const enrollmentMonth = enrollmentDate.getMonth();

        if (selectedYear < enrollmentYear || (selectedYear === enrollmentYear && monthIndex < enrollmentMonth)) {
            return { text: 'N/A', color: 'text-gray-600' };
        }

        const exceptionKey = `${selectedYear}-${monthIndex}`;
        const expectedFee = student.feeExceptions?.[exceptionKey] !== undefined
            ? student.feeExceptions[exceptionKey]
            : student.monthlyFee;

        const paymentsForMonth = yearPayments.filter(p => {
            const paymentDate = new Date(p.date);
            return p.studentId === student.id && paymentDate.getMonth() === monthIndex;
        });
        const totalPaid = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);

        const baseClasses = "cursor-pointer transition-colors hover:brightness-110";
        if (expectedFee === 0) {
            return { text: totalPaid > 0 ? formatCurrency(totalPaid) : 'Exento', color: `${baseClasses} bg-gray-600 text-gray-300` };
        }
        if (totalPaid >= expectedFee) {
            return { text: formatCurrency(totalPaid), color: `${baseClasses} bg-green-500/20 text-green-300` };
        }
        if (totalPaid > 0) {
            return { text: formatCurrency(totalPaid), color: `${baseClasses} bg-orange-500/20 text-orange-300` };
        }

        // Determinar si mostrar impagado
        if (selectedYear < realCurrentYear || (selectedYear === realCurrentYear && monthIndex < currentMonthIndex)) {
            return { text: 'Impagado', color: `${baseClasses} bg-red-500/20 text-red-300` };
        }
        return { text: '-', color: `${baseClasses} text-gray-500 hover:bg-gray-700` };
    };

    const handleOpenCostModal = (cost?: Cost) => {
        setEditingCost(cost);
        setCostToDuplicate(undefined);
        setIsCostModalOpen(true);
    };

    const handleDuplicateCost = (cost: Cost) => {
        setEditingCost(undefined);
        setCostToDuplicate({
            ...cost,
            paymentDate: new Date().toISOString().split('T')[0]
        });
        setIsCostModalOpen(true);
    };

    const handleCloseCostModal = () => {
        setEditingCost(undefined);
        setCostToDuplicate(undefined);
        setIsCostModalOpen(false);
    };

    const handleCostSubmit = (costData: Omit<Cost, 'id'> | Cost | Omit<Cost, 'id'>[]) => {
        if (Array.isArray(costData)) {
            costData.forEach(c => addCost(c));
        } else if ('id' in costData) {
            updateCost(costData);
        } else {
            addCost(costData);
        }
        handleCloseCostModal();
    };

    const handleCostDelete = (id: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este coste?')) {
            deleteCost(id);
        }
    };

    const handleEditStudent = (student: Student) => {
        setEditingStudent(student);
        setIsStudentModalOpen(true);
    };

    const handleStudentUpdateSubmit = (studentData: Omit<Student, 'id'> | Student) => {
        if ('id' in studentData) {
            updateStudent(studentData);
        }
        setIsStudentModalOpen(false);
        setEditingStudent(undefined);
    };

    const filteredStudents = students
        .filter(student => (student.active || searchQuery !== '') && student.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

    const filteredCosts = useMemo(() => {
        return yearCosts.filter(cost => {
            const searchString = `${cost.concept} ${cost.beneficiary} ${cost.notes || ''}`.toLowerCase();
            const matchesSearch = searchString.includes(costSearchQuery.toLowerCase());
            const matchesCategory = costCategoryFilter ? cost.category === costCategoryFilter : true;
            let matchesDate = true;
            if (costStartDate || costEndDate) {
                const costDate = new Date(cost.paymentDate);
                if (costStartDate) matchesDate = matchesDate && costDate >= new Date(costStartDate);
                if (costEndDate) matchesDate = matchesDate && costDate <= new Date(costEndDate);
            }
            return matchesSearch && matchesCategory && matchesDate;
        });
    }, [yearCosts, costSearchQuery, costCategoryFilter, costStartDate, costEndDate]);

    const selectedStudent = selectedMonthCell ? students.find(s => s.id === selectedMonthCell.studentId) : null;
    const selectedMonthPayments = useMemo(() => {
        if (!selectedMonthCell) return [];
        const { studentId, monthIndex, year } = selectedMonthCell;
        return payments.filter(p => {
            const d = new Date(p.date);
            return p.studentId === studentId && d.getMonth() === monthIndex && d.getFullYear() === year;
        });
    }, [selectedMonthCell, payments]);

    return (
        <div className="p-4 sm:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Facturación</h2>

                {/* SELECTOR DE AÑO */}
                <div className="flex items-center gap-2 bg-gray-800 p-1.5 rounded-xl border border-gray-700">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 mr-1">Ejercicio:</span>
                    {availableYears.map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${selectedYear === year ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex space-x-4 border-b border-gray-700 mb-6">
                <button className={`pb-2 px-4 ${activeTab === 'income' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400'}`} onClick={() => setActiveTab('income')}>Ingresos (Cuotas)</button>
                <button className={`pb-2 px-4 ${activeTab === 'costs' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400'}`} onClick={() => setActiveTab('costs')}>Gastos (Costes)</button>
            </div>

            {activeTab === 'income' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="w-1/3">
                            <input type="text" placeholder="Buscar alumno..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-400">Ingresos {selectedYear}</p>
                                <p className="text-xl font-bold text-green-400">{formatCurrency(totalIncome)}</p>
                            </div>
                            <button onClick={() => setIsIncomeModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Registrar Cobro</button>
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 bg-gray-700 sticky left-0 z-10">Alumno</th>
                                    {months.map((m, i) => <th key={i} className="px-2 py-3 text-center">{m.substring(0, 3)}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-4 py-3 font-medium text-white bg-gray-800 sticky left-0">
                                            <button onClick={() => handleEditStudent(student)} className="hover:text-purple-400 text-left">{student.name}</button>
                                        </td>
                                        {months.map((_, i) => {
                                            const status = getPaymentStatusForMonth(student, i);
                                            return (
                                                <td key={i} className={`px-2 py-3 text-center border-l border-gray-700/50 ${status.color}`} onClick={() => setSelectedMonthCell({ studentId: student.id, monthIndex: i, year: selectedYear })}>
                                                    {status.text}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'costs' && (
                <div>
                    <div className="flex flex-wrap gap-4 mb-4 bg-gray-800 p-4 rounded-lg">
                        <input type="text" placeholder="Buscar concepto/beneficiario..." value={costSearchQuery} onChange={e => setCostSearchQuery(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white flex-grow" />
                        <select value={costCategoryFilter} onChange={e => setCostCategoryFilter(e.target.value as CostCategory)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                            <option value="">Todas las categorías</option>
                            {['Profesores', 'Alquiler', 'Suministros', 'Licencias', 'Marketing', 'Mantenimiento', 'Otros'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="date" value={costStartDate} onChange={e => setCostStartDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
                        <input type="date" value={costEndDate} onChange={e => setCostEndDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Gastos {selectedYear}</p>
                            <p className="text-xl font-bold text-red-400">{formatCurrency(totalCosts)}</p>
                        </div>
                        <button onClick={() => handleOpenCostModal()} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Registrar Gasto</button>
                    </div>
                    <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Concepto</th>
                                    <th className="px-6 py-3">Categoría</th>
                                    <th className="px-6 py-3">Beneficiario</th>
                                    <th className="px-6 py-3">Importe</th>
                                    <th className="px-6 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCosts.map(cost => (
                                    <tr key={cost.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4">{new Date(cost.paymentDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{cost.concept}</td>
                                        <td className="px-6 py-4"><span className="bg-gray-700 px-2 py-1 rounded text-xs">{cost.category}</span></td>
                                        <td className="px-6 py-4">{cost.beneficiary}</td>
                                        <td className="px-6 py-4 font-bold text-white">{formatCurrency(cost.amount)}</td>
                                        <td className="px-6 py-4 space-x-2">
                                            <button onClick={() => handleOpenCostModal(cost)} className="text-purple-400 hover:text-purple-300">Editar</button>
                                            <button onClick={() => handleDuplicateCost(cost)} className="text-blue-400 hover:text-blue-300">Duplicar</button>
                                            <button onClick={() => handleCostDelete(cost.id)} className="text-red-400 hover:text-red-300">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Registrar Cobro">
                <PaymentForm students={students} onSubmit={(p) => { addPayment(p); setIsIncomeModalOpen(false); }} onCancel={() => setIsIncomeModalOpen(false)} />
            </Modal>
            <Modal isOpen={isCostModalOpen} onClose={handleCloseCostModal} title={editingCost ? 'Editar Coste' : 'Registrar Coste'}>
                <CostForm cost={editingCost} instructors={instructors} initialValues={costToDuplicate} onSubmit={handleCostSubmit} onCancel={handleCloseCostModal} />
            </Modal>
            <Modal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} title="Editar Alumno">
                {editingStudent && <StudentForm student={editingStudent} classes={classes} merchandiseSales={merchandiseSales} onSubmit={handleStudentUpdateSubmit} onCancel={() => setIsStudentModalOpen(false)} />}
            </Modal>
            {selectedStudent && selectedMonthCell && (
                <MonthlyDetailModal
                    isOpen={!!selectedMonthCell}
                    onClose={() => setSelectedMonthCell(null)}
                    student={selectedStudent}
                    monthIndex={selectedMonthCell.monthIndex}
                    year={selectedMonthCell.year}
                    payments={selectedMonthPayments}
                    onUpdateStudent={updateStudent}
                    onAddPayment={addPayment}
                    onUpdatePayment={updatePayment}
                    onDeletePayment={deletePayment}
                    onNavigateMonth={(dir) => {
                        setSelectedMonthCell(prev => {
                            if (!prev) return null;
                            let newMonth = prev.monthIndex + (dir === 'next' ? 1 : -1);
                            let newYear = prev.year;
                            if (newMonth > 11) { newMonth = 0; newYear++; }
                            if (newMonth < 0) { newMonth = 11; newYear--; }
                            return { ...prev, monthIndex: newMonth, year: newYear };
                        });
                    }}
                />
            )}
        </div>
    );
});

export default Billing;
