import React, { useState } from 'react';
import { Payment, Student, PaymentMethod, Cost, CostCategory, CostPaymentMethod } from '../types';
import Modal from './Modal';

// --- FORMULARIO DE COBROS (INGRESOS) ---
const PaymentForm: React.FC<{
    students: Student[];
    onSubmit: (payment: Omit<Payment, 'id'>) => void;
    onCancel: () => void;
}> = ({ students, onSubmit, onCancel }) => {
    // ... (El resto del formulario de cobro se mantiene igual)
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        studentId: '',
        concept: 'Cuota Mensual',
        amount: 0,
        paymentMethod: 'Efectivo' as PaymentMethod,
        notes: '',
    });

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
                        {students.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
    onSubmit: (cost: Omit<Cost, 'id'> | Cost) => void;
    onCancel: () => void;
}> = ({ cost, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        paymentDate: cost?.paymentDate || new Date().toISOString().split('T')[0],
        category: cost?.category || 'Otros' as CostCategory,
        beneficiary: cost?.beneficiary || '',
        concept: cost?.concept || '',
        amount: cost?.amount || 0,
        paymentMethod: cost?.paymentMethod || 'Transferencia' as CostPaymentMethod,
        isRecurring: cost?.isRecurring || false,
        notes: cost?.notes || '',
    });
    
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cost) {
            onSubmit({ ...cost, ...formData });
        } else {
            onSubmit(formData);
        }
    };

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
                <div className="flex items-center">
                    <input type="checkbox" name="isRecurring" id="isRecurring" checked={formData.isRecurring} onChange={handleChange} className="h-4 w-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 focus:ring-offset-gray-800" />
                    <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-200">Gasto Recurrente</label>
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
    payments: Payment[];
    costs: Cost[];
    students: Student[];
    addPayment: (payment: Omit<Payment, 'id'>) => void;
    addCost: (cost: Omit<Cost, 'id'>) => void;
    updateCost: (cost: Cost) => void;
    deleteCost: (id: string) => void;
}

const Billing: React.FC<BillingProps> = ({ payments, costs, students, addPayment, addCost, updateCost, deleteCost }) => {
    const [activeTab, setActiveTab] = useState<'income' | 'costs'>('income');
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isCostModalOpen, setIsCostModalOpen] = useState(false);
    const [editingCost, setEditingCost] = useState<Cost | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);
    const netMargin = totalIncome - totalCosts;

    // --- Lógica para la tabla de Ingresos ---
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    const getPaymentStatusForMonth = (student: Student, monthIndex: number) => {
        if (!student.enrollmentDate) {
             return { text: 'N/A', color: 'text-gray-600' };
        }

        const enrollmentDate = new Date(student.enrollmentDate);
        const enrollmentYear = enrollmentDate.getFullYear();
        const enrollmentMonth = enrollmentDate.getMonth();

        if (currentYear < enrollmentYear || (currentYear === enrollmentYear && monthIndex < enrollmentMonth)) {
            return { text: 'N/A', color: 'text-gray-600' };
        }

        const paymentsForMonth = payments.filter(p => {
            const paymentDate = new Date(p.date);
            return p.studentId === student.id && paymentDate.getMonth() === monthIndex && paymentDate.getFullYear() === currentYear;
        });
        const totalPaid = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);

        if (totalPaid >= student.monthlyFee) {
            return { text: `€${totalPaid.toFixed(2)}`, color: 'bg-green-500/20 text-green-300' };
        }
        if (totalPaid > 0) {
            return { text: `€${totalPaid.toFixed(2)}`, color: 'bg-orange-500/20 text-orange-300' };
        }
        if (monthIndex < currentMonthIndex) {
            return { text: 'Impagado', color: 'bg-red-500/20 text-red-300' };
        }
        return { text: '-', color: 'text-gray-500' };
    };
    
    // --- Handlers para modales de Costes ---
    const handleOpenCostModal = (cost?: Cost) => {
        setEditingCost(cost);
        setIsCostModalOpen(true);
    };

    const handleCloseCostModal = () => {
        setEditingCost(undefined);
        setIsCostModalOpen(false);
    };
    
    const handleCostSubmit = (cost: Omit<Cost, 'id'> | Cost) => {
        if ('id' in cost) {
            updateCost(cost);
        } else {
            addCost(cost);
        }
        handleCloseCostModal();
    };
    
    const handleCostDelete = (id: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este coste?')) {
            deleteCost(id);
        }
    };
    
    const filteredStudents = students.filter(student =>
        student.active && student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-8">
            <h2 className="text-3xl font-bold mb-6">Facturación</h2>
            {/* Resumen Financiero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm"><p className="text-sm text-green-400">Ingresos Totales</p><p className="text-2xl font-bold">€{totalIncome.toLocaleString('es-ES')}</p></div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm"><p className="text-sm text-red-400">Costes Totales</p><p className="text-2xl font-bold">€{totalCosts.toLocaleString('es-ES')}</p></div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm"><p className="text-sm text-blue-400">Margen Neto</p><p className="text-2xl font-bold">€{netMargin.toLocaleString('es-ES')}</p></div>
            </div>

            {/* Pestañas de Navegación */}
            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('income')} className={`${activeTab === 'income' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Ingresos</button>
                    <button onClick={() => setActiveTab('costs')} className={`${activeTab === 'costs' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Costes</button>
                </nav>
            </div>
            
            {activeTab === 'income' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold">Resumen de Cobros a Alumnos</h3>
                        <button onClick={() => setIsIncomeModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Registrar Cobro</button>
                    </div>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Buscar por nombre de alumno..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full max-w-sm bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                     <div className="bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 sticky left-0 bg-gray-700 z-10">Alumno/a</th>
                                    <th scope="col" className="px-6 py-3">Cuota</th>
                                    {months.map(month => <th key={month} scope="col" className="px-6 py-3 text-center">{month}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap sticky left-0 bg-gray-800 z-10">{student.name}</td>
                                        <td className="px-6 py-4">€{student.monthlyFee.toFixed(2)}</td>
                                        {months.map((_, index) => {
                                            const { text, color } = getPaymentStatusForMonth(student, index);
                                            return (
                                                <td key={index} className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                                                        {text}
                                                    </span>
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
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold">Registro de Gastos del Negocio</h3>
                        <button onClick={() => handleOpenCostModal()} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Registrar Coste</button>
                    </div>
                     <div className="bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Fecha</th>
                                    <th scope="col" className="px-6 py-3">Categoría</th>
                                    <th scope="col" className="px-6 py-3">Beneficiario</th>
                                    <th scope="col" className="px-6 py-3">Concepto</th>
                                    <th scope="col" className="px-6 py-3">Importe</th>
                                    <th scope="col" className="px-6 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {costs.map(cost => (
                                    <tr key={cost.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(cost.paymentDate).toLocaleDateString('es-ES')}</td>
                                        <td className="px-6 py-4">{cost.category}</td>
                                        <td className="px-6 py-4 font-medium text-white">{cost.beneficiary}</td>
                                        <td className="px-6 py-4">{cost.concept}</td>
                                        <td className="px-6 py-4 text-red-400">€{cost.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                            <button onClick={() => handleOpenCostModal(cost)} className="font-medium text-purple-400 hover:text-purple-300 hover:underline">Editar</button>
                                            <button onClick={() => handleCostDelete(cost.id)} className="font-medium text-red-400 hover:text-red-300 hover:underline">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Registrar Nuevo Cobro">
                <PaymentForm students={students} onSubmit={(p) => { addPayment(p); setIsIncomeModalOpen(false); }} onCancel={() => setIsIncomeModalOpen(false)} />
            </Modal>
            
             <Modal isOpen={isCostModalOpen} onClose={handleCloseCostModal} title={editingCost ? 'Editar Coste' : 'Registrar Nuevo Coste'}>
                <CostForm cost={editingCost} onSubmit={handleCostSubmit} onCancel={handleCloseCostModal} />
            </Modal>
        </div>
    );
};

export default Billing;