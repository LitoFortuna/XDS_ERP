
import React, { useState, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, 
    AreaChart, Area, ComposedChart 
} from 'recharts';
import { Student, DanceClass, Instructor, Payment, Cost, View, NuptialDance, DanceEvent } from '../types';

interface DashboardProps {
  students: Student[];
  classes: DanceClass[];
  instructors: Instructor[];
  payments: Payment[];
  costs: Cost[];
  nuptialDances: NuptialDance[];
  events: DanceEvent[];
  setView: (view: View) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#4B5563'];

const formatCurrency = (v: number, decimals: number = 0) => {
    const parts = v.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (decimals > 0 ? parts.join(',') : parts[0]) + '€';
};

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    subtext?: string; 
    icon: React.ReactNode; 
    color?: string;
    onClick?: () => void;
}> = ({ title, value, subtext, icon, color = "blue", onClick }) => {
    return (
        <div 
            onClick={onClick}
            className={`bg-[#1a2233] p-5 rounded-2xl border border-gray-800/50 flex items-center gap-4 shadow-xl transition-all ${onClick ? 'cursor-pointer hover:bg-[#232d42] hover:scale-[1.02]' : ''}`}
        >
            <div className={`p-3 rounded-xl bg-gray-800/80 flex items-center justify-center text-${color}-400 shadow-inner`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-0.5">{title}</p>
                <p className="text-2xl font-black text-white leading-none">{value}</p>
                {subtext && <p className="text-[10px] text-gray-500 mt-1 font-medium">{subtext}</p>}
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ students, classes, payments, instructors, costs, nuptialDances, events, setView, addPayment }) => {
    const realToday = new Date();
    const [selectedYear, setSelectedYear] = useState(realToday.getFullYear());
    const currentMonth = realToday.getMonth();
    const monthShortNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const availableYears = [2024, 2025, 2026, 2027];

    const [selectedRentMonth, setSelectedRentMonth] = useState(currentMonth);
    const [unpaidSearchQuery, setUnpaidSearchQuery] = useState('');

    // --- FILTRADO DE DATOS POR AÑO SELECCIONADO ---
    const filteredPayments = useMemo(() => payments.filter(p => new Date(p.date).getFullYear() === selectedYear), [payments, selectedYear]);
    const filteredCosts = useMemo(() => costs.filter(c => new Date(c.paymentDate).getFullYear() === selectedYear), [costs, selectedYear]);

    const activeStudents = students.filter(s => s.active);
    const newStudentsThisYearMonth = students.filter(s => {
        const d = new Date(s.enrollmentDate);
        return d.getMonth() === currentMonth && d.getFullYear() === selectedYear;
    }).length;

    const totalRevenue = filteredPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalCosts = filteredCosts.reduce((acc, c) => acc + c.amount, 0);
    const profit = totalRevenue - totalCosts;
    const roi = totalCosts > 0 ? ((profit / totalCosts) * 100).toFixed(1) : '0';

    const globalCapacity = classes.reduce((acc, c) => acc + c.capacity, 0);
    const globalOccupancy = globalCapacity > 0 ? ((activeStudents.length / globalCapacity) * 100).toFixed(1) : '0';

    // --- LÓGICA DE IMPAGADOS FILTRADA POR AÑO ---
    const unpaidStudentsInfo = useMemo(() => {
        // Determinar hasta qué mes calcular según el año seleccionado
        const maxMonthToCheck = selectedYear < realToday.getFullYear() ? 11 : (selectedYear === realToday.getFullYear() ? currentMonth : -1);

        return students
            .filter(s => s.active && s.monthlyFee > 0)
            .map(student => {
                const unpaidMonths: string[] = [];
                let totalDebt = 0;
                const enrollmentDate = new Date(student.enrollmentDate);
                
                for (let m = 0; m <= maxMonthToCheck; m++) {
                    const monthDate = new Date(selectedYear, m, 1);
                    if (monthDate < new Date(enrollmentDate.getFullYear(), enrollmentDate.getMonth(), 1)) continue;
                    // Si el alumno se dio de baja antes de este mes, no genera deuda
                    if (student.deactivationDate && monthDate > new Date(student.deactivationDate)) continue;

                    const paymentsForMonth = payments.filter(p => {
                        const pd = new Date(p.date);
                        return p.studentId === student.id && pd.getMonth() === m && pd.getFullYear() === selectedYear;
                    });
                    const paid = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
                    
                    const exceptionKey = `${selectedYear}-${m}`;
                    const expected = student.feeExceptions?.[exceptionKey] ?? student.monthlyFee;

                    if (paid < expected) {
                        unpaidMonths.push(monthShortNames[m]);
                        totalDebt += (expected - paid);
                    }
                }
                return { ...student, unpaidMonths, totalDebt };
            })
            .filter(info => info.totalDebt > 0)
            .sort((a, b) => b.totalDebt - a.totalDebt);
    }, [students, payments, currentMonth, selectedYear]);

    const filteredUnpaidStudents = useMemo(() => {
        return unpaidStudentsInfo.filter(student => 
            student.name.toLowerCase().includes(unpaidSearchQuery.toLowerCase())
        );
    }, [unpaidStudentsInfo, unpaidSearchQuery]);

    const totalPendingAmount = unpaidStudentsInfo.reduce((sum, info) => sum + info.totalDebt, 0);
    const collectionRate = (totalRevenue + totalPendingAmount) > 0 
        ? ((totalRevenue / (totalRevenue + totalPendingAmount)) * 100).toFixed(1) 
        : '100';

    const activeStudentsHistory = monthShortNames.map((name, m) => {
        const date = new Date(selectedYear, m + 1, 0);
        const count = students.filter(s => {
            const start = new Date(s.enrollmentDate);
            if (start > date) return false;
            if (s.deactivationDate) {
                const end = new Date(s.deactivationDate);
                if (end <= date) return false;
            }
            return true;
        }).length;
        return { name, Alumnos: count };
    });

    const rentabilidadData = useMemo(() => {
        return classes.map(c => {
            const studentsInClass = students.filter(s => s.enrolledClassIds.includes(c.id));
            const ingresosEstimados = studentsInClass.reduce((sum, s) => {
                const enrollDate = new Date(s.enrollmentDate);
                const targetDate = new Date(selectedYear, selectedRentMonth, 1);
                const nextMonthDate = new Date(selectedYear, selectedRentMonth + 1, 1);
                
                if (enrollDate >= nextMonthDate) return sum;
                if (s.deactivationDate && new Date(s.deactivationDate) < targetDate) return sum;

                const exceptionKey = `${selectedYear}-${selectedRentMonth}`;
                const fee = s.feeExceptions?.[exceptionKey] ?? s.monthlyFee;
                const proportion = s.enrolledClassIds.length > 0 ? 1 / s.enrolledClassIds.length : 0;
                return sum + (fee * proportion);
            }, 0);
            
            const instructor = instructors.find(i => i.id === c.instructorId);
            const gastosEstimados = (instructor?.ratePerClass ?? 25) * c.days.length * 4; 

            return {
                name: c.name,
                Ingresos: Math.round(ingresosEstimados),
                Gastos: Math.round(gastosEstimados)
            };
        }).sort((a, b) => b.Ingresos - a.Ingresos).slice(0, 30);
    }, [classes, students, instructors, selectedRentMonth, selectedYear]);

    const popularClasses = useMemo(() => {
        return classes.map(c => ({
            name: c.name,
            alumnos: students.filter(s => s.enrolledClassIds.includes(c.id)).length
        })).sort((a, b) => b.alumnos - a.alumnos).slice(0, 10);
    }, [classes, students]);

    const finanzasHistory = monthShortNames.map((name, m) => {
        const monthIncome = filteredPayments.filter(p => new Date(p.date).getMonth() === m).reduce((s, p) => s + p.amount, 0);
        const monthCost = filteredCosts.filter(c => new Date(c.paymentDate).getMonth() === m).reduce((s, c) => s + c.amount, 0);
        return { name: name.toLowerCase(), Ingresos: monthIncome, Gastos: monthCost };
    });

    return (
        <div className="p-6 bg-[#0f172a] min-h-screen text-gray-200 pb-24 space-y-8 font-sans">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-white tracking-tight">Dashboard General</h2>
                
                {/* SELECTOR DE AÑO COMPACTO */}
                <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700 shadow-inner">
                    {availableYears.map(year => (
                        <button 
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedYear === year ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Alumnos Activos" 
                    value={activeStudents.length.toLocaleString('es-ES')} 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
                    color="blue" 
                />
                <StatCard 
                    title={`Nuevos (${monthShortNames[currentMonth]})`} 
                    value={newStudentsThisYearMonth.toLocaleString('es-ES')} 
                    subtext={`Crecimiento en ${selectedYear}`} 
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>} 
                    color="emerald" 
                />
                <StatCard 
                    title="Ingresos" 
                    value={formatCurrency(totalRevenue)} 
                    subtext={`Año fiscal ${selectedYear}`}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
                    color="emerald" 
                />
                 <StatCard 
                    title="Pendiente Cobro" 
                    value={formatCurrency(totalPendingAmount)} 
                    subtext={`Deuda acumulada en ${selectedYear}`}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
                    color="rose" 
                />
            </div>

            {/* GRÁFICO 1: Evolución Clientes */}
            <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40 shadow-2xl">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></span>
                    Evolución de Clientes Activos ({selectedYear})
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={activeStudentsHistory}>
                        <defs>
                            <linearGradient id="colorStudents" x1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} domain={[0, 'dataMax + 20']} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="Alumnos" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorStudents)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* TABLA: Alumnos con Pagos Pendientes */}
            <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/50 shadow-2xl overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-wider">
                            <span className="w-2 h-6 bg-rose-500 rounded-full shadow-[0_0_15px_#f43f5e]"></span>
                            Alumnas con Pagos Pendientes ({selectedYear})
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold ml-5 uppercase tracking-tighter mt-1 opacity-60 italic">Gestión de cobros para el ejercicio {selectedYear}</p>
                    </div>
                    <div className="relative w-full md:w-72 group">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-rose-400">
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Filtrar por nombre..." 
                            value={unpaidSearchQuery}
                            onChange={(e) => setUnpaidSearchQuery(e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-800 rounded-2xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/50 transition-all font-bold placeholder-gray-600 shadow-inner"
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto max-h-[580px] overflow-y-auto custom-scrollbar rounded-xl border border-gray-800/30">
                    <table className="w-full text-xs text-left border-separate border-spacing-0">
                        <thead className="text-[10px] uppercase font-black text-gray-400 sticky top-0 z-20">
                            <tr className="bg-[#1a2233]/90 backdrop-blur-md">
                                <th className="px-6 py-5 border-b border-gray-800/60 tracking-widest">Alumna</th>
                                <th className="px-6 py-5 border-b border-gray-800/60 tracking-widest text-center">Meses Pendientes ({selectedYear})</th>
                                <th className="px-6 py-5 border-b border-gray-800/60 tracking-widest text-right">Deuda Pendiente</th>
                                <th className="px-6 py-5 border-b border-gray-800/60 tracking-widest text-right">Acción de Cobro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/30">
                            {filteredUnpaidStudents.map(student => (
                                <tr key={student.id} className="hover:bg-gray-800/40 transition-all duration-200 group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500/10 to-rose-500/5 flex items-center justify-center text-rose-400 font-black text-xs border border-rose-500/20 group-hover:scale-110 transition-transform">
                                                {student.name.charAt(0)}
                                            </div>
                                            <span className="font-black text-white text-sm tracking-tight">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {student.unpaidMonths.map(m => (
                                                <span key={m} className="px-3 py-1 rounded-full bg-[#3b1c21] text-rose-300 text-[9px] font-black border border-rose-500/10 shadow-sm">{m}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-black text-rose-400 text-lg leading-none tracking-tighter">{formatCurrency(student.totalDebt, 2)}</span>
                                            <span className="text-[8px] text-gray-500 uppercase mt-1 font-bold tracking-tighter opacity-70">En el año {selectedYear}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button 
                                            onClick={() => window.open(`https://wa.me/${student.phone}?text=Hola%20${student.name},%20te%20escribimos%20de%20Xen%20Dance%20Space%20porque%20hemos%20visto%20que%20tienes%20un%20pendiente%20de%20${formatCurrency(student.totalDebt, 2)}.%20¿Podrías%20revisarlo?%20¡Gracias!`, '_blank')}
                                            className="bg-[#10b981]/5 text-[#10b981] px-4 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.1em] border border-[#10b981]/20 hover:bg-[#10b981] hover:text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-3 ml-auto group/btn shadow-sm"
                                        >
                                            <svg className="w-3 h-3 transition-transform group-hover/btn:scale-110" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.038 3.284l-.569 2.103 2.2-.547c.946.517 2.012.808 3.103.81 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm3.385 8.195c-.145.407-.847.742-1.18.806-.323.063-.734.086-1.18-.086-.233-.086-.531-.205-.913-.371-1.63-.709-2.701-2.381-2.783-2.493-.082-.111-.669-.888-.669-1.693 0-.805.423-1.199.573-1.362.15-.163.323-.205.431-.205s.215.003.308.008c.099.005.233-.037.363.27.145.342.494 1.201.537 1.29s.072.18.012.301-.09.18-.18.286c-.09.106-.188.238-.269.319-.09.09-.184.188-.08.363.104.175.465.766 1 1.242.686.611 1.263.801 1.438.887.175.086.276.072.378-.045s.443-.516.562-.693c.12-.177.239-.15.401-.09s1.026.484 1.206.574c.18.09.3.135.342.21s.042.54-.103.947z"/></svg>
                                            Notificar WhatsApp
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                        Evolución Financiera ({selectedYear})
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={finanzasHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={v => formatCurrency(v)} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} formatter={(v: number) => formatCurrency(v)} />
                            <Legend verticalAlign="bottom" iconType="diamond" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                            <Area type="monotone" dataKey="Ingresos" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.2} />
                            <Area type="monotone" dataKey="Gastos" stroke="#f43f5e" strokeWidth={3} fill="#f43f5e" fillOpacity={0.15} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                        Distribución Pagos ({selectedYear})
                    </h3>
                    <div className="flex h-full items-center">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie 
                                    data={[
                                        { name: 'Efectivo', value: filteredPayments.filter(p => p.paymentMethod === 'Efectivo').reduce((s,p)=>s+p.amount,0) },
                                        { name: 'Transferencia', value: filteredPayments.filter(p => p.paymentMethod === 'Transferencia').reduce((s,p)=>s+p.amount,0) },
                                        { name: 'Domiciliación', value: filteredPayments.filter(p => p.paymentMethod === 'Domiciliación').reduce((s,p)=>s+p.amount,0) },
                                        { name: 'Bizum', value: filteredPayments.filter(p => p.paymentMethod === 'Bizum').reduce((s,p)=>s+p.amount,0) },
                                    ]} 
                                    innerRadius={55} 
                                    outerRadius={75} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {COLORS.map((entry, index) => <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#2563eb', '#f59e0b'][index % 4]} stroke="none" />)}
                                </Pie>
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
