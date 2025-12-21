
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
            className={`bg-[#1a2233] p-5 rounded-2xl border border-gray-800 flex items-center gap-4 shadow-lg transition-all ${onClick ? 'cursor-pointer hover:bg-[#232d42] hover:scale-[1.02]' : ''}`}
        >
            <div className={`p-3 rounded-xl bg-gray-800/50 flex items-center justify-center text-${color}-400`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{title}</p>
                <p className="text-xl font-black text-white">{value}</p>
                {subtext && <p className="text-[10px] text-gray-500 mt-0.5">{subtext}</p>}
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ students, classes, payments, instructors, costs, nuptialDances, events, setView, addPayment }) => {
    const currentYear = new Date().getFullYear();
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

    // --- LÓGICA DE IMPAGADOS ---
    const unpaidStudentsInfo = useMemo(() => {
        return students
            .filter(s => s.active && s.monthlyFee > 0)
            .map(student => {
                const unpaidMonths: string[] = [];
                let totalDebt = 0;
                const enrollmentDate = new Date(student.enrollmentDate);
                
                for (let m = 0; m <= currentMonth; m++) {
                    const monthDate = new Date(currentYear, m, 1);
                    if (monthDate < enrollmentDate) continue;

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
    const collectionRate = totalRevenue > 0 ? ((totalRevenue / (totalRevenue + totalPendingAmount)) * 100).toFixed(1) : '0';

    // --- DATOS DE GRÁFICOS ---
    
    // 1. Evolución Clientes
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

    // 2. Rentabilidad por Clase
    const rentabilidadData = useMemo(() => {
        return classes.map(c => {
            const studentsInClass = students.filter(s => s.enrolledClassIds.includes(c.id));
            const ingresosEstimados = studentsInClass.reduce((sum, s) => sum + (s.monthlyFee / s.enrolledClassIds.length), 0);
            
            const instructor = instructors.find(i => i.id === c.instructorId);
            const gastosEstimados = (instructor?.ratePerClass ?? 25) * c.days.length * 4; // Estimado mensual

            return {
                name: c.name,
                Ingresos: Math.round(ingresosEstimados),
                Gastos: Math.round(gastosEstimados)
            };
        }).sort((a, b) => b.Ingresos - a.Ingresos).slice(0, 30);
    }, [classes, students, instructors]);

    // 3. Top Clases Populares
    const popularClasses = useMemo(() => {
        return classes.map(c => ({
            name: c.name,
            alumnos: students.filter(s => s.enrolledClassIds.includes(c.id)).length
        })).sort((a, b) => b.alumnos - a.alumnos).slice(0, 10);
    }, [classes, students]);

    // 4. Demografía
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

    // 5. Evolución Financiera
    const finanzasHistory = monthNames.map((name, m) => {
        const monthIncome = payments.filter(p => new Date(p.date).getMonth() === m).reduce((s, p) => s + p.amount, 0);
        const monthCost = costs.filter(c => new Date(c.paymentDate).getMonth() === m).reduce((s, c) => s + c.amount, 0);
        return { name, Ingresos: monthIncome, Gastos: monthCost };
    });

    // 6. Próximos Cumpleaños
    const upcomingBirthdays = useMemo(() => {
        const today = new Date();
        return students
            .filter(s => s.active && s.birthDate)
            .map(s => {
                const bday = new Date(s.birthDate!);
                const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
                if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
                return { ...s, nextBday };
            })
            .sort((a, b) => a.nextBday.getTime() - b.nextBday.getTime())
            .slice(0, 4);
    }, [students]);

    const formatCurrency = (v: number) => `€${v.toLocaleString('es-ES')}`;

    return (
        <div className="p-6 bg-[#0f172a] min-h-screen text-gray-200 pb-20 space-y-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Dashboard General</h2>

            {/* FILA 1: KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Alumnos Activos" value={activeStudents.length} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>} color="blue" />
                <StatCard title="Nuevos (Mes)" value={newStudentsThisMonth} subtext="Crecimiento mensual" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>} color="emerald" />
                <StatCard title="Ocupación Global" value={`${globalOccupancy}%`} subtext="Capacidad utilizada" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} color="purple" />
                <StatCard title="Beneficio Total" value={`€${(profit / 1000).toFixed(0)} mil`} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} color="indigo" />
                
                <StatCard title="ROI (Global)" value={`${roi}%`} subtext="Retorno inversión" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} color="indigo" />
                <StatCard title="Tasa de Cobro" value={`${collectionRate}%`} subtext="Año actual" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="emerald" />
                <StatCard title="Pendiente Cobro" value={`€${totalPendingAmount.toFixed(0)}`} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="rose" />
                <StatCard title="Profesores" value={instructors.length} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} color="blue" />
            </div>

            {/* GRÁFICO 1: Evolución Clientes */}
            <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Evolución de Clientes Activos ({currentYear})
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={activeStudentsHistory}>
                        <defs>
                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                        <Area type="monotone" dataKey="Alumnos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* GRÁFICO 2: Rentabilidad Clase */}
            <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                            Rentabilidad por Clase
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase">Ingresos vs Gastos estimados por grupo</p>
                    </div>
                    <select className="bg-gray-800 border-none rounded-lg text-xs px-3 py-1.5 text-gray-300">
                        <option>Diciembre {currentYear}</option>
                    </select>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={rentabilidadData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={v => `€${v}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                        <Legend iconType="rect" verticalAlign="bottom" wrapperStyle={{paddingTop: '20px'}} />
                        <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} name="Gastos Estimados" />
                        <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} name="Ingresos Estimados" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* FILA 3: Popularidad + Finanzas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                        Top 10 Clases Más Populares
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart layout="vertical" data={popularClasses}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                            <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                            <Bar dataKey="alumnos" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                        Evolución Financiera ({currentYear})
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={finanzasHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={v => `${v/1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                            <Legend />
                            <Area type="monotone" dataKey="Ingresos" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                            <Area type="monotone" dataKey="Gastos" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* FILA 4: Ingreso Medio + Métodos Pago */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                        <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                        Ingreso Medio por Alumno/Clase
                    </h3>
                    <p className="text-[9px] text-gray-500 mb-6 italic uppercase tracking-tighter">Cálculo: (Pago mensual / Nº clases inscritas) promedio</p>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={finanzasHistory.map(f => ({...f, ratio: (f.Ingresos / (activeStudents.length || 1)).toFixed(1)}))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                            <YAxis domain={[10, 40]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                            <Line type="step" dataKey="ratio" stroke="#a78bfa" strokeWidth={3} dot={{r: 4, fill: '#fff', stroke: '#a78bfa'}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                        Distribución Métodos de Pago
                    </h3>
                    <div className="flex h-full items-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie 
                                    data={[
                                        { name: 'Efectivo', value: payments.filter(p => p.paymentMethod === 'Efectivo').length },
                                        { name: 'Transferencia', value: payments.filter(p => p.paymentMethod === 'Transferencia').length },
                                        { name: 'Domiciliación', value: payments.filter(p => p.paymentMethod === 'Domiciliación').length },
                                        { name: 'Bizum', value: payments.filter(p => p.paymentMethod === 'Bizum').length },
                                    ]} 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {COLORS.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* FILA 5: Demografía + Profesores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        Demografía: Distribución por Edad
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={demografiaData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} cursor={{fill: '#1e293b'}} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50}>
                                {demografiaData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#ec4899', '#8b5cf6', '#3b82f6', '#10b981'][index]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-4 bg-pink-500 rounded-full"></span>
                        Top 5 Profesores (por nº alumnos)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart layout="vertical" data={instructors.map(i => ({ name: i.name, value: students.filter(s => classes.filter(c => c.instructorId === i.id).some(c => s.enrolledClassIds.includes(c.id))).length })).sort((a,b) => b.value - a.value).slice(0, 5)}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} cursor={{fill: '#1e293b'}} />
                            <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={25} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* FILA 6: Resumen + Matrículas + Cumples */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800 flex flex-col items-center">
                    <h3 className="text-sm font-bold text-white mb-6 w-full text-left">Resumen Financiero Total</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie 
                                data={[
                                    { name: 'Ingresos', value: totalRevenue },
                                    { name: 'Costes', value: totalCosts }
                                ]} 
                                dataKey="value" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={80}
                            >
                                <Cell fill="#8b5cf6" />
                                <Cell fill="#f43f5e" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-4 text-xs font-bold uppercase">
                        <span className="text-rose-500">■ Costes</span>
                        <span className="text-purple-500">■ Ingresos</span>
                    </div>
                </div>

                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800 flex flex-col items-center">
                    <h3 className="text-sm font-bold text-white mb-6 w-full text-left">Estado de Matrículas</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie 
                                data={[
                                    { name: 'Activos', value: activeStudents.length },
                                    { name: 'Inactivos', value: students.length - activeStudents.length }
                                ]} 
                                dataKey="value" 
                                innerRadius={60} 
                                outerRadius={80}
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="#4b5563" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-4 text-xs font-bold uppercase">
                        <span className="text-emerald-500">■ Activos</span>
                        <span className="text-gray-500">■ Inactivos</span>
                    </div>
                </div>

                <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-white">Próximos Cumpleaños</h3>
                        <span className="bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold">7 días</span>
                    </div>
                    <div className="space-y-4">
                        {upcomingBirthdays.map(s => (
                            <div key={s.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                                        {s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-white">{s.name}</p>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase ${s.active ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}`}>
                                                {s.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500">Cumple {new Date().getFullYear() - new Date(s.birthDate!).getFullYear()} años</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-purple-400">{s.nextBday.getDate()} {monthNames[s.nextBday.getMonth()]}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TABLA: Alumnos con Pagos Pendientes */}
            <div className="bg-[#1a2233] p-6 rounded-3xl border border-gray-800 shadow-2xl">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-rose-500 rounded-full"></span>
                    Alumnos con Pagos Pendientes ({currentYear})
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase text-gray-500 border-b border-gray-800">
                            <tr>
                                <th className="px-4 py-3">Alumno</th>
                                <th className="px-4 py-3">Meses Pendientes</th>
                                <th className="px-4 py-3">Deuda Total</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {unpaidStudentsInfo.map(student => (
                                <tr key={student.id} className="hover:bg-gray-800/20 transition-colors">
                                    <td className="px-4 py-4 font-bold text-white">{student.name}</td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {student.unpaidMonths.map(m => (
                                                <span key={m} className="px-2 py-0.5 rounded bg-rose-900/30 text-rose-400 text-[9px] font-bold">{m}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 font-black text-rose-400 text-sm">€{student.totalDebt.toFixed(2)}</td>
                                    <td className="px-4 py-4 text-right">
                                        <button 
                                            onClick={() => window.open(`https://wa.me/${student.phone}?text=Hola%20${student.name},%20te%20escribimos%20de%20Xen%20Dance%20Space%20por%20un%20pendiente...`, '_blank')}
                                            className="bg-emerald-900/50 text-emerald-400 px-3 py-1.5 rounded-lg font-bold border border-emerald-500/30 hover:bg-emerald-800 flex items-center gap-2 ml-auto"
                                        >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.038 3.284l-.569 2.103 2.2-.547c.946.517 2.012.808 3.103.81 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm3.385 8.195c-.145.407-.847.742-1.18.806-.323.063-.734.086-1.18-.086-.233-.086-.531-.205-.913-.371-1.63-.709-2.701-2.381-2.783-2.493-.082-.111-.669-.888-.669-1.693 0-.805.423-1.199.573-1.362.15-.163.323-.205.431-.205s.215.003.308.008c.099.005.233-.037.363.27.145.342.494 1.201.537 1.29s.072.18.012.301-.09.18-.18.286c-.09.106-.188.238-.269.319-.09.09-.184.188-.08.363.104.175.465.766 1 1.242.686.611 1.263.801 1.438.887.175.086.276.072.378-.045s.443-.516.562-.693c.12-.177.239-.15.401-.09s1.026.484 1.206.574c.18.09.3.135.342.21s.042.54-.103.947z"/></svg>
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
