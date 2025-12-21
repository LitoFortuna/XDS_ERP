
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine } from 'recharts';
import { Student, DanceClass, Instructor, Payment, Cost, View, NuptialDance, DanceEvent, DayOfWeek } from '../types';
import Modal from './Modal';

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

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#6366F1'];

const StatCard: React.FC<{ title: string; value: string | number; subtext?: string; color?: string; children: React.ReactNode; onClick?: () => void; }> = ({ title, value, subtext, color = "purple", children, onClick }) => {
    const colorClasses: Record<string, { bg: string, text: string }> = {
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
        green: { bg: 'bg-green-500/10', text: 'text-green-400' },
        red: { bg: 'bg-red-500/10', text: 'text-red-400' },
        pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
        yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
        teal: { bg: 'bg-teal-500/10', text: 'text-teal-400' },
    };

    const activeColor = colorClasses[color] || colorClasses['purple'];

    const cardContent = (
        <div className={`
            bg-gray-800 p-6 rounded-2xl w-full h-full flex items-center
            shadow-[6px_6px_12px_#111827,-4px_-4px_12px_#374151]
            border border-gray-700/20
            transition-all duration-300 ease-in-out
            ${onClick ? 'group hover:-translate-y-1 hover:shadow-[8px_8px_16px_#111827,-6px_-6px_16px_#374151]' : ''}
        `}>
            <div className={`rounded-xl p-4 mr-4 shadow-inner ${activeColor.bg} ${activeColor.text}`}>
                {children}
            </div>
            <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-100">{value}</p>
                {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
            </div>
        </div>
    );

    if (onClick) {
        return (
            <button onClick={onClick} className="text-left w-full h-full focus:outline-none">
                {cardContent}
            </button>
        );
    }
    
    return <div className="w-full h-full">{cardContent}</div>;
};

const Dashboard: React.FC<DashboardProps> = ({ students, classes, payments, instructors, costs, nuptialDances, events, setView, addPayment }) => {
    const activeStudentsCount = students.filter(s => s.active).length;
    
    const totalRegularRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalNuptialRevenue = nuptialDances.reduce((acc, d) => acc + (d.paidAmount || 0), 0);
    const totalEventRevenue = events.reduce((acc, e) => acc + (e.price * (e.participantIds?.length || 0)), 0);
    
    const totalRevenue = totalRegularRevenue + totalNuptialRevenue + totalEventRevenue;
    const totalCosts = costs.reduce((acc, c) => acc + c.amount, 0);
    const totalProfit = totalRevenue - totalCosts;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // DATA FOR PIE CHART: Revenue Source
    const revenueDistribution = [
        { name: 'Cuotas Alumnos', value: totalRegularRevenue },
        { name: 'Bailes Nupciales', value: totalNuptialRevenue },
        { name: 'Eventos', value: totalEventRevenue }
    ];

    // DATA FOR BAR CHART: Occupancy by category
    const occupancyData = useMemo(() => {
        const categories = ['Fitness', 'Baile Moderno', 'Competición', 'Especializada'];
        return categories.map(cat => {
            const catClasses = classes.filter(c => c.category === cat);
            const capacity = catClasses.reduce((acc, c) => acc + c.capacity, 0);
            const enrolled = students.filter(s => s.active && s.enrolledClassIds.some(id => catClasses.some(cc => cc.id === id))).length;
            return {
                name: cat,
                Inscritos: enrolled,
                Capacidad: capacity,
                Ocupacion: capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0
            };
        });
    }, [classes, students]);

    const upcomingRehearsals = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return (nuptialDances || [])
            .flatMap(dance => (dance.rehearsals || [])
                .filter(r => r.status === 'Pendiente' && r.date >= todayStr)
                .map(r => ({ ...r, coupleName: dance.coupleName }))
            )
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 4);
    }, [nuptialDances]);

    const upcomingEventsList = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return (events || [])
            .filter(e => e.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 4);
    }, [events]);

    const activeStudentsHistory = monthNames.map((month, index) => {
        const lastDayOfMonth = new Date(currentYear, index + 1, 0);
        const count = students.filter(s => {
            if (!s.enrollmentDate) return false;
            const enrollmentDate = new Date(s.enrollmentDate);
            if (enrollmentDate > lastDayOfMonth) return false;
            if (s.deactivationDate) {
                const deactivationDate = new Date(s.deactivationDate);
                if (deactivationDate <= lastDayOfMonth) return false;
            }
            return true;
        }).length;
        return { name: month.substring(0, 3), Alumnos: count };
    });

    const monthlyData = [
        ...payments.map(p => ({ type: 'income', date: p.date, amount: p.amount })),
        ...costs.map(c => ({ type: 'cost', date: c.paymentDate, amount: c.amount }))
    ].reduce((acc: any, item) => {
        const date = new Date(item.date);
        const month = date.toLocaleString('es-ES', { month: 'short' });
        const year = date.getFullYear();
        const key = `${year}-${date.getMonth()}`;
        if (!acc[key]) {
            acc[key] = { month: `${month}`, Ingresos: 0, Gastos: 0, monthIndex: date.getMonth(), year: year };
        }
        if (item.type === 'income') {
            acc[key].Ingresos += item.amount;
        } else {
            acc[key].Gastos += item.amount;
        }
        return acc;
    }, {});

    const sortedMonthlyData = Object.values(monthlyData).sort((a: any, b: any) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIndex - b.monthIndex;
    });

    const formatCurrency = (value: number) => `€${value.toLocaleString('es-ES', { minimumFractionDigits: 0 })}`;
    const containerClass = "bg-gray-800 p-6 rounded-2xl shadow-[5px_5px_15px_#111827,-2px_-2px_10px_#374151] border border-gray-700/30";

    return (
        <div className="p-4 sm:p-8 space-y-8 pb-20">
            <h2 className="text-3xl font-bold mb-4">Panel de Control General</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Alumnos Activos" value={activeStudentsCount} color="blue" onClick={() => setView(View.STUDENTS)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </StatCard>
                <StatCard title="Beneficio Total" value={`€${totalProfit.toLocaleString('es-ES', { notation: "compact" })}`} color={totalProfit >= 0 ? "purple" : "red"} onClick={() => setView(View.BILLING)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
                </StatCard>
                <StatCard title="Ingresos Eventos" value={`€${totalEventRevenue.toLocaleString('es-ES')}`} color="green" onClick={() => setView(View.EVENTS)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </StatCard>
                 <StatCard title="Ensayos Boda" value={upcomingRehearsals.length} color="pink" onClick={() => setView(View.NUPTIAL_DANCES)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </StatCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Finanzas Mensuales Area Chart */}
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></span>
                        Finanzas Mensuales (Ingresos vs Gastos)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={sortedMonthlyData}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                            <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(value) => `€${Number(value).toLocaleString('es-ES', { notation: "compact" })}`} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF', borderRadius: '8px' }} formatter={(value: number) => formatCurrency(value)} />
                            <Area type="monotone" dataKey="Ingresos" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="Gastos" stroke="#EF4444" fillOpacity={0.1} fill="#EF4444" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Revenue Distribution Pie Chart */}
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></span>
                        Origen de los Ingresos
                    </h3>
                    <div className="flex flex-col md:flex-row items-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={revenueDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {revenueDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="md:ml-4 space-y-2">
                            {revenueDistribution.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-gray-400">{item.name}:</span>
                                    <span className="text-white font-bold">{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Occupancy Bar Chart */}
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
                        Ocupación por Categoría
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={occupancyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="Inscritos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Capacidad" fill="#4B5563" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 4. Evolution of active customers */}
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899]"></span>
                        Evolución Alumnado Activo ({currentYear})
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={activeStudentsHistory}>
                             <defs>
                                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="Alumnos" stroke="#EC4899" fillOpacity={1} fill="url(#colorStudents)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899]"></span>
                        Ensayos Nupciales Pendientes
                    </h3>
                    <div className="space-y-3">
                        {upcomingRehearsals.length > 0 ? upcomingRehearsals.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-700">
                                <div>
                                    <p className="font-bold text-white text-sm">{r.coupleName}</p>
                                    <p className="text-xs text-gray-400">{new Date(r.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {r.startTime}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-pink-400 font-bold px-2 py-1 bg-pink-500/10 rounded uppercase">Boda</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm italic text-center py-4">No hay ensayos pendientes.</p>
                        )}
                    </div>
                </div>

                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]"></span>
                        Próximos Eventos
                    </h3>
                    <div className="space-y-3">
                        {upcomingEventsList.length > 0 ? upcomingEventsList.map((e, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-700">
                                <div>
                                    <p className="font-bold text-white text-sm">{e.name}</p>
                                    <p className="text-xs text-gray-400">{new Date(e.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {e.time}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${e.type === 'Competición' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {e.type}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm italic text-center py-4">No hay eventos próximos.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
