
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine } from 'recharts';
import { Student, DanceClass, Instructor, Payment, Cost, View, NuptialDance, DayOfWeek, DanceEvent } from '../types';
import Modal from './Modal';
import { PaymentForm } from './Billing';

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
    const totalEventRevenue = (events || []).reduce((acc, e) => acc + (e.price * e.participantIds.length), 0);
    
    const totalRevenue = totalRegularRevenue + totalNuptialRevenue + totalEventRevenue;
    const totalCosts = costs.reduce((acc, c) => acc + c.amount, 0);
    const totalProfit = totalRevenue - totalCosts;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Upcoming Events Logic
    const upcomingEvents = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return (events || [])
            .filter(e => e.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 4);
    }, [events]);

    // Upcoming Rehearsals Logic
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

    const unpaidStudentsInfo = students
        .filter(s => s.active && s.monthlyFee > 0 && s.enrollmentDate)
        .map(student => {
            const unpaidMonths: { name: string; amount: number; monthIndex: number }[] = [];
            let totalDebt = 0;
            const enrollmentDate = new Date(student.enrollmentDate);
            const enrollmentYear = enrollmentDate.getFullYear();
            const enrollmentMonth = enrollmentDate.getMonth();
            if (currentYear < enrollmentYear) return { id: student.id, name: student.name, totalDebt: 0 };
            const startMonth = (currentYear === enrollmentYear) ? enrollmentMonth : 0;
            for (let monthIndex = startMonth; monthIndex <= currentMonth; monthIndex++) {
                const paymentsForMonth = payments.filter(p => {
                    const paymentDate = new Date(p.date);
                    return p.studentId === student.id && paymentDate.getMonth() === monthIndex && paymentDate.getFullYear() === currentYear;
                });
                const totalPaidForMonth = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
                const exceptionKey = `${currentYear}-${monthIndex}`;
                const monthlyExpected = student.feeExceptions?.[exceptionKey] !== undefined 
                    ? student.feeExceptions[exceptionKey] 
                    : student.monthlyFee;
                if (totalPaidForMonth < monthlyExpected) {
                    const pendingAmount = monthlyExpected - totalPaidForMonth;
                    unpaidMonths.push({ name: monthNames[monthIndex], amount: pendingAmount, monthIndex });
                    totalDebt += pendingAmount;
                }
            }
            return { id: student.id, name: student.name, unpaidMonths, totalDebt };
        })
        .filter(info => info.totalDebt > 0);
    
    const totalPendingAmount = unpaidStudentsInfo.reduce((sum, info) => sum + info.totalDebt, 0);

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
        ...costs.map(c => ({ type: 'cost', date: c.paymentDate, amount: c.amount })),
        ...(events || []).map(e => ({ type: 'income', date: e.date, amount: e.price * e.participantIds.length }))
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

    const formatCurrency = (value: number) => `€${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const containerClass = "bg-gray-800 p-6 rounded-2xl shadow-[5px_5px_15px_#111827,-2px_-2px_10px_#374151] border border-gray-700/30";

    return (
        <div className="p-4 sm:p-8 space-y-8 pb-20">
            <h2 className="text-3xl font-bold mb-4">Dashboard General</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Alumnos Activos" value={activeStudentsCount} color="blue" onClick={() => setView(View.STUDENTS)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </StatCard>
                <StatCard title="Beneficio Total" value={`€${totalProfit.toLocaleString('es-ES', { notation: "compact" })}`} color={totalProfit >= 0 ? "purple" : "red"} onClick={() => setView(View.BILLING)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
                </StatCard>
                <StatCard title="Ingresos Eventos" value={`€${totalEventRevenue.toLocaleString('es-ES')}`} subtext="Talleres y Compes" color="yellow" onClick={() => setView(View.EVENTS)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                </StatCard>
                <StatCard title="Pendiente Cobro" value={`€${totalPendingAmount.toLocaleString('es-ES')}`} color="red">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </StatCard>
            </div>

            {/* UPCOMING ACTIVITIES ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-yellow-500 rounded-full shadow-[0_0_10px_#eab308]"></span>
                        Próximos Eventos
                    </h3>
                    <div className="space-y-3">
                        {upcomingEvents.length > 0 ? upcomingEvents.map(e => (
                            <div key={e.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-700">
                                <div>
                                    <p className="font-bold text-white text-sm">{e.name}</p>
                                    <p className="text-xs text-gray-400">{new Date(e.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {e.location}</p>
                                </div>
                                <span className="text-[10px] uppercase font-bold px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">{e.type}</span>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm italic text-center py-4">No hay eventos programados.</p>
                        )}
                        <button onClick={() => setView(View.EVENTS)} className="w-full mt-2 text-xs text-purple-400 hover:text-purple-300 font-medium text-center">Ver todos los eventos →</button>
                    </div>
                </div>

                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899]"></span>
                        Ensayos de Boda
                    </h3>
                    <div className="space-y-3">
                        {upcomingRehearsals.length > 0 ? upcomingRehearsals.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-700">
                                <div>
                                    <p className="font-bold text-white text-sm">{r.coupleName}</p>
                                    <p className="text-xs text-gray-400">{new Date(r.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {r.startTime}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-pink-400 font-bold px-2 py-1 bg-pink-500/10 rounded">Ensayo</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm italic text-center py-4">No hay ensayos pendientes.</p>
                        )}
                        <button onClick={() => setView(View.NUPTIAL_DANCES)} className="w-full mt-2 text-xs text-purple-400 hover:text-purple-300 font-medium text-center">Gestionar bailes nupciales →</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
                        Evolución de Clientes Activos ({currentYear})
                    </h3>
                     <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={activeStudentsHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="Alumnos" stroke="#3B82F6" fillOpacity={1} fill="url(#colorStudents)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                         <span className="w-2 h-6 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></span>
                         Finanzas Mensuales
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
            </div>
        </div>
    );
};

export default Dashboard;
