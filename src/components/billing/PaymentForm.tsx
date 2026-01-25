
import React, { useState, useEffect, useMemo } from 'react';
import { Payment, Student, PaymentMethod } from '../../../types';

interface PaymentFormProps {
    students: Student[];
    onSubmit: (payment: Omit<Payment, 'id'>) => void;
    onCancel: () => void;
    initialValues?: Partial<Omit<Payment, 'id'>>;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ students, onSubmit, onCancel, initialValues }) => {
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

export default PaymentForm;
