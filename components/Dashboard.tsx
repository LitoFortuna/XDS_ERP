
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

/**
 * Helper centralizado para formato de moneda.
 * Formato solicitado: 32.650€ (punto para millares, euro al final)
 */
const formatCurrency = (v: number, decimals: number = 0) => {
    return v.toLocaleString('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }) + '€';
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
    const currentYear = 2025; 
    const currentMonth = new Date().getMonth();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // --- CÁLCULOS DE KPIs ---
    const activeStudents = students.filter(s => s.active);
    const newStudentsThisMonth = students.filter(s => {
        const d = new Date(s.enrollmentDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalCosts = costs.reduce((acc, c) => acc + c.amount, 0);
    const profit = totalRevenue - totalCosts;
    const roi = totalCosts > 0 ? ((profit / totalCosts) * 100).toFixed(1) : '0';

    const globalCapacity = classes.reduce((acc, c) => acc + c.capacity, 0);
    const globalOccupancy = globalCapacity > 0 ? ((activeStudents.length / globalCapacity) * 100).toFixed(1) : '0';

    // --- LÓGICA DE IMPAGADOS DETALLADA ---
    const unpaidStudentsInfo = useMemo(() => {
        return students
            .filter(s => s.active && s.monthlyFee > 0)
            .map(student => {
                const unpaidMonths: string[] = [];
                let totalDebt = 0;
                const enrollmentDate = new Date(student.enrollmentDate);
                
                for (let m = 0; m <= currentMonth; m++) {
                    const monthDate = new Date(currentYear, m, 1);
                    if (monthDate < new Date(enrollmentDate.getFullYear(), enrollmentDate.getMonth(), 1)) continue;

                    const paymentsForMonth = payments.filter(p => {
                        const pd = new Date(p.date);
                        return p.studentId === student.id && pd.getMonth() === m && pd.getFullYear() === currentYear;
                    });
                    const paid = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
                    
                    const exceptionKey = `${currentYear}-${m}`;
                    const expected = student.feeExceptions?.[exceptionKey] ?? student.monthlyFee;

                    if (paid < expected) {
                        unpaidMonths.push(monthNames[m]);
                        totalDebt += (expected - paid);
                    }
                }
                return { ...student, unpaidMonths, totalDebt };
            })
            .filter(info => info.totalDebt > 0)
            .sort((a, b) => b.totalDebt - a.totalDebt);
    }, [students, payments, currentMonth, currentYear]);

    const totalPendingAmount = unpaidStudentsInfo.reduce((sum, info) => sum + info.totalDebt, 0);
    const collectionRate = (totalRevenue + totalPendingAmount) > 0 
        ? ((totalRevenue / (totalRevenue + totalPendingAmount)) * 100).toFixed(1) 
        : '100';

    // --- DATOS DE GRÁFICOS ---
    const activeStudentsHistory = monthNames.map((name, m) => {
        const date = new Date(currentYear, m + 1, 0);
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
                const proportion = s.enrolledClassIds.length > 0 ? 1 / s.enrolledClassIds.length : 0;
                return sum + (s.monthlyFee * proportion);
            }, 0);
            
            const instructor = instructors.find(i => i.id === c.instructorId);
            const gastosEstimados = (instructor?.ratePerClass ?? 25) * c.days.length * 4; 

            return {
                name: c.name,
                Ingresos: Math.round(ingresosEstimados),
                Gastos: Math.round(gastosEstimados)
            };
        }).sort((a, b) => b.Ingresos - a.Ingresos).slice(0, 30);
    }, [classes, students, instructors]);

    const popularClasses = useMemo(() => {
        return classes.map(c => ({
            name: c.name,
            alumnos: students.filter(s => s.enrolledClassIds.includes(c.id)).length
        })).sort((a, b) => b.alumnos - a.alumnos).slice(0, 10);
    }, [classes, students]);

    const demografiaData = useMemo(() => {
        const counts = { 'Infantil (3-11)': 0, 'Junior (12-17)': 0, 'Adultos (18-60)': 0, 'Senior (60+)': 0 };
        students.filter(s => s.active && s.birthDate).forEach(s => {
            const age = new Date().getFullYear() - new Date(s.birthDate!).getFullYear();
            if (age < 12) counts['Infantil (3-11)']++;
            else if (age < 18) counts['Junior (12-17)']++;
            else if (age < 60) counts['Adultos (18-60)']++;
            else counts['Senior (60+)']++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [students]);

    const finanzasHistory = monthNames.map((name, m) => {
        const monthIncome = payments.filter(p => new Date(p.date).getMonth() === m && new Date(p.date).getFullYear() === currentYear).reduce((s, p) => s + p.amount, 0);
        const monthCost = costs.filter(c => new Date(c.paymentDate).getMonth() === m && new Date(c.paymentDate).getFullYear() === currentYear).reduce((s, c) => s + c.amount, 0);
        return { name: name.toLowerCase(), Ingresos: monthIncome, Gastos: monthCost };
    });

    const upcomingBirthdays = useMemo(() => {
        const today = new Date();
        return students
            .filter(s => s.birthDate)
            .map(s => {
                const bday = new Date(s.birthDate!);
                let nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
                if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
                return { ...s, nextBday };
            })
            .sort((a, b) => a.nextBday.getTime() - b.nextBday.getTime())
            .slice(0, 3);
    }, [students]);

    return (
        <div className="p-6 bg-[#0f172a] min-h-screen text-gray-200 pb-24 space-y-8 font-sans">
            <h2 className="text-3xl font-black text-white tracking-tight">Dashboard General</h2>

            {/* FILA 1: KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Alumnos Activos" value={activeStudents.length.toLocaleString('es-ES')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>} color="blue" />
                <StatCard title="Nuevos (Mes)" value={newStudentsThisMonth.toLocaleString('es-ES')} subtext="Crecimiento mensual" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>} color="emerald" />
                <StatCard title="Ocupación Global" value={`${globalOccupancy}%`} subtext="Capacidad utilizada" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} color="purple" />
                <StatCard title="Beneficio Total" value={formatCurrency(profit)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} color="indigo" />
                
                <StatCard title="ROI (Global)" value={`${roi}%`} subtext="Retorno inversión" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} color="indigo" />
                <StatCard title="Tasa de Cobro" value={`${collectionRate}%`} subtext="Año actual" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="emerald" />
                <StatCard title="Pendiente Cobro" value={formatCurrency(totalPendingAmount)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="rose" />
                <StatCard title="Profesores" value={instructors.length} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} color="blue" />
            </div>

            {/* GRÁFICO 1: Evolución Clientes */}
            <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40 shadow-2xl">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></span>
                    Evolución de Clientes Activos ({currentYear})
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={activeStudentsHistory}>
                        <defs>
                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
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

            {/* GRÁFICO 2: Rentabilidad Clase */}
            <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40 shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-4 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></span>
                            Rentabilidad por Clase
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Ingresos vs Gastos estimados por grupo</p>
                    </div>
                    <select className="bg-gray-800 border border-gray-700 rounded-lg text-[10px] font-bold px-3 py-1.5 text-gray-300 uppercase tracking-widest outline-none">
                        <option>Diciembre {currentYear}</option>
                    </select>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={rentabilidadData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9, fontWeight: 700}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={v => `${v.toLocaleString('es-ES')}€`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '11px' }} formatter={(v: number) => formatCurrency(v)} />
                        <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                        <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} name="Gastos Estimados" />
                        <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} name="Ingresos Estimados" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* FILA: Popularidad + Finanzas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_#8b5cf6]"></span>
                        Top 10 Clases Más Populares
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart layout="vertical" data={popularClasses}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                            <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                            <Bar dataKey="alumnos" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={22} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                        Evolución Financiera (Año actual)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={finanzasHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={v => `${v.toLocaleString('es-ES')}€`} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} formatter={(v: number) => formatCurrency(v)} />
                            <Legend verticalAlign="bottom" iconType="diamond" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                            <Area type="monotone" dataKey="Ingresos" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.2} />
                            <Area type="monotone" dataKey="Gastos" stroke="#f43f5e" strokeWidth={3} fill="#f43f5e" fillOpacity={0.15} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* FILA: Ingreso Medio + Métodos Pago */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                        <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                        Ingreso Medio por Alumno/Clase
                    </h3>
                    <p className="text-[9px] text-gray-500 mb-6 italic uppercase tracking-tighter">Cálculo: Promedio de cuotas por clase inscrita.</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={finanzasHistory.map(f => ({...f, ratio: (f.Ingresos / (activeStudents.length || 1)).toFixed(1)}))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                            <YAxis domain={[10, 40]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={v => `${v.toLocaleString('es-ES')}€`} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} formatter={(v: any) => `${parseFloat(v).toLocaleString('es-ES')}€`} />
                            <Line type="monotone" dataKey="ratio" stroke="#a78bfa" strokeWidth={4} dot={{r: 4, fill: '#fff', stroke: '#a78bfa', strokeWidth: 2}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                        Distribución Métodos de Pago (Volumen €)
                    </h3>
                    <div className="flex h-full items-center">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie 
                                    data={[
                                        { name: 'Efectivo', value: payments.filter(p => p.paymentMethod === 'Efectivo').reduce((s,p)=>s+p.amount,0) },
                                        { name: 'Transferencia', value: payments.filter(p => p.paymentMethod === 'Transferencia').reduce((s,p)=>s+p.amount,0) },
                                        { name: 'Domiciliación', value: payments.filter(p => p.paymentMethod === 'Domiciliación').reduce((s,p)=>s+p.amount,0) },
                                        { name: 'Bizum', value: payments.filter(p => p.paymentMethod === 'Bizum').reduce((s,p)=>s+p.amount,0) },
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

            {/* FILA: Resumen + Matrículas + Cumples */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40 flex flex-col items-center shadow-xl">
                    <h3 className="text-xs font-black text-white mb-6 w-full text-left uppercase tracking-tighter">Resumen Financiero Total</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie 
                                data={[
                                    { name: 'Ingresos', value: totalRevenue },
                                    { name: 'Costes', value: totalCosts }
                                ]} 
                                dataKey="value" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={65}
                                stroke="none"
                            >
                                <Cell fill="#8b5cf6" />
                                <Cell fill="#f43f5e" />
                            </Pie>
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-4 text-[9px] font-black uppercase tracking-widest">
                        <span className="text-rose-500">■ Costes: {formatCurrency(totalCosts)}</span>
                        <span className="text-purple-500">■ Ingresos: {formatCurrency(totalRevenue)}</span>
                    </div>
                </div>

                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40 flex flex-col items-center shadow-xl">
                    <h3 className="text-xs font-black text-white mb-6 w-full text-left uppercase tracking-tighter">Estado de Matrículas</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie 
                                data={[
                                    { name: 'Activos', value: activeStudents.length },
                                    { name: 'Inactivos', value: students.length - activeStudents.length }
                                ]} 
                                dataKey="value" 
                                innerRadius={45} 
                                outerRadius={65}
                                stroke="none"
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="#4b5563" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-4 text-[9px] font-black uppercase tracking-widest">
                        <span className="text-emerald-500">■ Activos: {activeStudents.length.toLocaleString('es-ES')}</span>
                        <span className="text-gray-500">■ Inactivos: {(students.length - activeStudents.length).toLocaleString('es-ES')}</span>
                    </div>
                </div>

                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/40 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-white uppercase tracking-tighter">Próximos Cumpleaños</h3>
                        <span className="bg-purple-900/50 text-purple-400 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest">7 DÍAS</span>
                    </div>
                    <div className="space-y-4">
                        {upcomingBirthdays.map(s => {
                            const age = new Date().getFullYear() - new Date(s.birthDate!).getFullYear();
                            return (
                            <div key={s.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center text-xs font-black text-purple-400 border border-gray-700/50 shadow-inner group-hover:bg-purple-500/10 transition-colors">
                                        {s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-black text-white">{s.name}</p>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${s.active ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
                                                {s.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-bold mt-0.5">Cumple {age} años</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-purple-400 bg-purple-500/5 px-2 py-1 rounded-lg border border-purple-500/10">{s.nextBday.getDate()} {monthNames[s.nextBday.getMonth()]}</p>
                            </div>
                        )})}
                    </div>
                </div>
            </div>

            {/* TABLA: Alumnos con Pagos Pendientes */}
            <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800/50 shadow-2xl overflow-hidden">
                <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <span className="w-1.5 h-5 bg-rose-500 rounded-full shadow-[0_0_12px_#f43f5e]"></span>
                    Alumnos con Pagos Pendientes ({currentYear})
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase font-black text-gray-500 border-b border-gray-800">
                            <tr>
                                <th className="px-5 py-4">Alumna</th>
                                <th className="px-5 py-4 text-center">Meses Pendientes</th>
                                <th className="px-5 py-4 text-right">Deuda Total</th>
                                <th className="px-5 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/40">
                            {unpaidStudentsInfo.map(student => (
                                <tr key={student.id} className="hover:bg-gray-800/30 transition-all duration-150">
                                    <td className="px-5 py-4 font-black text-white text-sm">{student.name}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-1.5 justify-center">
                                            {student.unpaidMonths.map(m => (
                                                <span key={m} className="px-2.5 py-1 rounded-md bg-rose-900/40 text-rose-300 text-[9px] font-black border border-rose-500/20">{m}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right font-black text-rose-400 text-base">{formatCurrency(student.totalDebt, 2)}</td>
                                    <td className="px-5 py-4 text-right">
                                        <button 
                                            onClick={() => window.open(`https://wa.me/${student.phone}?text=Hola%20${student.name},%20te%20escribimos%20de%20Xen%20Dance%20Space%20porque%20hemos%20visto%20que%20tienes%20un%20pendiente%20de%20${formatCurrency(student.totalDebt, 2)}.%20¿Podrías%20revisarlo?%20¡Gracias!`, '_blank')}
                                            className="bg-[#10b981]/10 text-[#10b981] px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border border-[#10b981]/20 hover:bg-[#10b981] hover:text-white transition-all flex items-center gap-2 ml-auto shadow-lg"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.038 3.284l-.569 2.103 2.2-.547c.946.517 2.012.808 3.103.81 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm3.385 8.195c-.145.407-.847.742-1.18.806-.323.063-.734.086-1.18-.086-.233-.086-.531-.205-.913-.371-1.63-.709-2.701-2.381-2.783-2.493-.082-.111-.669-.888-.669-1.693 0-.805.423-1.199.573-1.362.15-.163.323-.205.431-.205s.215.003.308.008c.099.005.233-.037.363.27.145.342.494 1.201.537 1.29s.072.18.012.301-.09.18-.18.286c-.09.106-.188.238-.269.319-.09.09-.184.188-.08.363.104.175.465.766 1 1.242.686.611 1.263.801 1.438.887.175.086.276.072.378-.045s.443-.516.562-.693c.12-.177.239-.15.401-.09s1.026.484 1.206.574c.18.09.3.135.342.21s.042.54-.103.947z"/></svg>
                                            Reclamar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
