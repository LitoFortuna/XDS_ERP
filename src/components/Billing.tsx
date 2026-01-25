import React, { useState, useMemo, useEffect } from 'react';
import { Payment, Student, PaymentMethod, Cost, CostCategory, CostPaymentMethod, DanceClass, MerchandiseSale, Instructor } from '../../types';
import Modal from './Modal';
import { StudentForm } from './StudentList';
import { useAppStore } from '../store/useAppStore';
import { useAppActions } from '../hooks/useAppActions';
import { exportPaymentsToCSV, exportCostsToCSV, downloadCSV } from '../utils/csvExportUtils';
import MonthlyDetailModal from './billing/MonthlyDetailModal';
import PaymentForm from './billing/PaymentForm';
import CostForm from './billing/CostForm';


/**
 * Formateador de moneda robusto que garantiza el formato 12.056€
 */
const formatCurrency = (v: number, decimals: number = 2) => {
    const parts = v.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(',') + '€';
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

    const handleExportPayments = () => {
        const csv = exportPaymentsToCSV(yearPayments, students);
        downloadCSV(`ingresos_${selectedYear}.csv`, csv);
    };

    const handleExportCosts = () => {
        const csv = exportCostsToCSV(filteredCosts);
        downloadCSV(`gastos_${selectedYear}.csv`, csv);
    };

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
                            <button
                                onClick={handleExportPayments}
                                className="bg-purple-600/20 text-purple-300 px-4 py-2 rounded hover:bg-purple-600/30 flex items-center gap-2 border border-purple-500/30 transition-all shadow-sm"
                                title="Exportar ingresos a Excel (CSV)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12L12 16.5m0 0L16.5 12M12 16.5V3" />
                                </svg>
                                <span>Exportar</span>
                            </button>
                            <button onClick={() => setIsIncomeModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow-lg shadow-green-900/20 font-bold transition-transform active:scale-95">
                                + Nuevo Cobro
                            </button>
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
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportCosts}
                                className="bg-purple-600/20 text-purple-300 px-4 py-2 rounded hover:bg-purple-600/30 flex items-center gap-2 border border-purple-500/30 transition-all shadow-sm"
                                title="Exportar gastos a Excel (CSV)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12L12 16.5m0 0L16.5 12M12 16.5V3" />
                                </svg>
                                <span>Exportar</span>
                            </button>
                            <button onClick={() => handleOpenCostModal()} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 shadow-lg shadow-red-900/20 font-bold transition-transform active:scale-95">
                                Registrar Gasto
                            </button>
                        </div>
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
