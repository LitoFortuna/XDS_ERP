
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Student, DanceClass, Instructor, Payment, Cost, View, NuptialDance } from '../types';
import { obtenerRespuestaGemini } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';

interface DashboardProps {
  students: Student[];
  classes: DanceClass[];
  instructors: Instructor[];
  payments: Payment[];
  costs: Cost[];
  nuptialDances: NuptialDance[];
  setView: (view: View) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; children: React.ReactNode; onClick?: () => void; }> = ({ title, value, children, onClick }) => {
    const cardContent = (
        <div className="bg-gray-800 p-6 rounded-lg shadow-sm flex items-center w-full h-full">
            <div className="bg-purple-500/20 text-purple-400 rounded-full p-3 mr-4">
                {children}
            </div>
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );

    if (onClick) {
        return (
            <button onClick={onClick} className="text-left transition-transform duration-200 hover:scale-105 w-full">
                {cardContent}
            </button>
        );
    }
    
    return <div className="w-full">{cardContent}</div>;
};

const Dashboard: React.FC<DashboardProps> = ({ students, classes, payments, instructors, costs, nuptialDances, setView }) => {
    const [aiInsights, setAiInsights] = useState<string | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [insightError, setInsightError] = useState(false);

    const totalStudents = students.length;
    
    // Revenue Calculation: Regular Payments + Nuptial Dance Payments
    const totalRegularRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalNuptialRevenue = nuptialDances.reduce((acc, d) => acc + (d.paidAmount || 0), 0);
    const totalRevenue = totalRegularRevenue + totalNuptialRevenue;

    const totalCosts = costs.reduce((acc, c) => acc + c.amount, 0);

    // --- Logic for Unpaid Students ---
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const unpaidStudentsInfo = students
        .filter(s => s.active && s.monthlyFee > 0 && s.enrollmentDate)
        .map(student => {
            const unpaidMonths: string[] = [];
            let totalDebt = 0;

            const enrollmentDate = new Date(student.enrollmentDate);
            const enrollmentYear = enrollmentDate.getFullYear();
            const enrollmentMonth = enrollmentDate.getMonth();

            if (currentYear < enrollmentYear) {
                return { name: student.name, phone: student.phone, unpaidMonths: [], totalDebt: 0 };
            }
            
            const startMonth = (currentYear === enrollmentYear) ? enrollmentMonth : 0;

            for (let monthIndex = startMonth; monthIndex <= currentMonthIndex; monthIndex++) {
                const paymentsForMonth = payments.filter(p => {
                    const paymentDate = new Date(p.date);
                    return p.studentId === student.id && paymentDate.getMonth() === monthIndex && paymentDate.getFullYear() === currentYear;
                });
                const totalPaidForMonth = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);

                if (totalPaidForMonth < student.monthlyFee) {
                    unpaidMonths.push(monthNames[monthIndex]);
                    totalDebt += student.monthlyFee - totalPaidForMonth;
                }
            }

            return {
                name: student.name,
                phone: student.phone,
                unpaidMonths,
                totalDebt,
            };
        })
        .filter(info => info.totalDebt > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    
    const totalPendingAmount = unpaidStudentsInfo.reduce((sum, info) => sum + info.totalDebt, 0);
    
    const handleWhatsAppReminder = (info: { name: string; phone: string; totalDebt: number; unpaidMonths: string[] }) => {
        if (!info.phone) {
            alert(`El alumno ${info.name} no tiene un número de teléfono registrado.`);
            return;
        }

        const sanitizedPhone = `34${info.phone.replace(/[\s-()]/g, '')}`;
        const monthsString = info.unpaidMonths.join(', ');
        const debtString = info.totalDebt.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

        const message = `¡Hola ${info.name}! Te escribimos desde Xen Dance Space para recordarte que tienes un pago pendiente de ${debtString} correspondiente a los meses de ${monthsString}. Puedes realizar el pago por los medios habituales. ¡Muchas gracias!`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    // Modificado: Datos ordenados para el gráfico horizontal
    const classEnrollmentData = classes
        .map(c => ({
            name: c.name,
            Inscritos: students.filter(s => s.enrolledClassIds.includes(c.id)).length,
            Capacidad: c.capacity,
        }))
        .sort((a, b) => b.Inscritos - a.Inscritos); // Ordenar por mayor número de inscritos
    
    // Split into Top 5 and Bottom 5
    const top5Classes = classEnrollmentData.slice(0, 5);
    // Sort ascending for bottom 5 to show the least enrolled at the top (or simply take the tail)
    // Here we take the original sorted list (descending), reverse it to get ascending (0, 1, 2...), and take first 5.
    const bottom5Classes = [...classEnrollmentData].sort((a, b) => a.Inscritos - b.Inscritos).slice(0, 5);

    type MonthlyData = { month: string; Ingresos: number; Gastos: number; monthIndex: number; year: number };

    const initialMonthlyData: Record<string, MonthlyData> = {};
    const monthlyData = [
        ...payments.map(p => ({ type: 'income', date: p.date, amount: p.amount })),
        ...costs.map(c => ({ type: 'cost', date: c.paymentDate, amount: c.amount }))
    ].reduce((acc, item) => {
        const date = new Date(item.date);
        const month = date.toLocaleString('es-ES', { month: 'short' });
        const year = date.getFullYear();
        const key = `${year}-${date.getMonth()}`;
        
        if (!acc[key]) {
            acc[key] = { month, Ingresos: 0, Gastos: 0, monthIndex: date.getMonth(), year: year };
        }

        if (item.type === 'income') {
            acc[key].Ingresos += item.amount;
        } else {
            acc[key].Gastos += item.amount;
        }
        
        return acc;
    }, initialMonthlyData);

    const sortedMonthlyData = Object.values(monthlyData).sort((a: MonthlyData, b: MonthlyData) => {
        if (a.year !== b.year) {
            return a.year - b.year;
        }
        return a.monthIndex - b.monthIndex;
    });

    // Data for new charts
    const financialSummaryData = [
        { name: 'Ingresos', value: totalRevenue },
        { name: 'Costes', value: totalCosts },
    ];

    const activeStudentsCount = students.filter(s => s.active).length;
    const studentStatusData = [
        { name: 'Activos', value: activeStudentsCount },
        { name: 'Inactivos', value: students.length - activeStudentsCount },
    ];

    const classCategoryCounts: { [key: string]: number } = classes.reduce((acc, c) => {
      acc[c.category] = 0;
      return acc;
    }, {} as Record<string, number>);

    students.forEach(student => {
      (student.enrolledClassIds || []).forEach(classId => {
        const danceClass = classes.find(c => c.id === classId);
        if (danceClass && classCategoryCounts.hasOwnProperty(danceClass.category)) {
          classCategoryCounts[danceClass.category]++;
        }
      });
    });

    const classPopularityData = Object.entries(classCategoryCounts).map(([name, value]) => ({
      name,
      Alumnos: value,
    }));
    
    // --- Logic for Upcoming Birthdays ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize for accurate date comparisons

    const upcomingBirthdays = students
      .filter(student => student.active && student.birthDate)
      .map(student => {
        const birthDate = new Date(student.birthDate);
        const thisYearBirthday = new Date(birthDate.getTime());
        thisYearBirthday.setFullYear(today.getFullYear());
        thisYearBirthday.setHours(0,0,0,0);

        // If birthday has already passed this year, check for next year's
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const age = thisYearBirthday.getFullYear() - birthDate.getFullYear();

        return { name: student.name, birthday: thisYearBirthday, age };
      })
      .filter(b => {
        // Filter for birthdays within the next 7 days
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
        return b.birthday >= today && b.birthday <= sevenDaysFromNow;
      })
      .sort((a, b) => a.birthday.getTime() - b.birthday.getTime());

    // --- AI Insights Generator ---
    const generateDashboardInsights = async () => {
        setLoadingInsights(true);
        setInsightError(false);
        const topClasses = classEnrollmentData.slice(0, 3).map(c => `${c.name} (${c.Inscritos} alumnos)`);
        const lowClasses = classEnrollmentData.filter(c => c.Inscritos < 3).map(c => c.name);
        
        const summary = `
            Actúa como un experto consultor de negocios para la escuela "Xen Dance Space". Analiza los siguientes datos actuales:
            - Alumnos Totales: ${totalStudents} (Activos: ${activeStudentsCount}, Inactivos: ${students.length - activeStudentsCount}).
            - Finanzas Globales: Ingresos ${totalRevenue}€ vs Costes ${totalCosts}€.
            - Deuda Pendiente de alumnos: ${totalPendingAmount}€.
            - Clases más populares: ${topClasses.join(', ')}.
            - Clases con baja ocupación (<3): ${lowClasses.length > 0 ? lowClasses.join(', ') : 'Ninguna'}.
            
            Basado en esto, dame:
            1. Un breve análisis del estado de salud del negocio.
            2. 3 Acciones concretas y breves para mejorar la retención o los ingresos este mes.
            Usa un tono profesional pero motivador. Formato limpio con puntos.
        `;

        const response = await obtenerRespuestaGemini(summary);
        
        if (response.startsWith("Hubo un error") || response.startsWith("Error:")) {
            setInsightError(true);
        }
        
        setAiInsights(response);
        setLoadingInsights(false);
    };


    const COLORS_FINANCIAL = ['#7C00BA', '#FF4136'];
    const COLORS_STATUS = ['#00B7FF', '#4b5563'];
    
    const formatCurrency = (value: number) => `€${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="p-4 sm:p-8 space-y-8">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard title="Total Alumnos" value={totalStudents} onClick={() => setView(View.STUDENTS)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </StatCard>
                <StatCard title="Total Clases" value={classes.length} onClick={() => setView(View.CLASSES)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </StatCard>
                <StatCard title="Total Profesores" value={instructors.length} onClick={() => setView(View.INSTRUCTORS)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0z" /></svg>
                </StatCard>
                <StatCard title="Ingresos Totales" value={`€${totalRevenue.toLocaleString('es-ES')}`} onClick={() => setView(View.BILLING)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
                </StatCard>
                 <StatCard title="Pendiente de Cobro" value={`€${totalPendingAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </StatCard>
            </div>

            {/* --- AI INSIGHTS SECTION --- */}
            <div className="bg-gradient-to-r from-purple-900/40 to-gray-800 p-6 rounded-lg border border-purple-500/30 relative overflow-hidden">
                <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
                            <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Xen AI Insights</h3>
                            <p className="text-sm text-purple-200">Análisis inteligente de tu negocio</p>
                        </div>
                    </div>
                    {!aiInsights && !loadingInsights && (
                         <button 
                            onClick={generateDashboardInsights}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md font-medium text-sm transition-all shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            Generar Análisis
                        </button>
                    )}
                </div>

                {loadingInsights && (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-purple-500/20 rounded w-3/4"></div>
                        <div className="h-4 bg-purple-500/20 rounded w-1/2"></div>
                        <div className="h-4 bg-purple-500/20 rounded w-5/6"></div>
                    </div>
                )}

                {aiInsights && (
                    <div className={`prose prose-invert prose-sm max-w-none ${insightError ? 'text-red-300' : 'text-gray-200'}`}>
                        <div className="whitespace-pre-wrap">{aiInsights}</div>
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={generateDashboardInsights}
                                className="text-xs text-purple-400 hover:text-purple-300 underline"
                            >
                                Actualizar análisis
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- CLASS STATS ROW (Split into Top 5 and Bottom 5) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-4 text-white">Top 5: Mayor Ocupación</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={top5Classes} 
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" horizontal={false} vertical={true} />
                                <XAxis type="number" tick={{ fill: 'white' }} />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    tick={{ fill: 'white', fontSize: 11 }} 
                                    width={140}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF' }} 
                                    cursor={{ fill: 'rgba(124, 0, 186, 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="Inscritos" fill="#7C00BA" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="Capacidad" fill="#00B7FF" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-4 text-white">Top 5: Menor Ocupación (Atención)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={bottom5Classes} 
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" horizontal={false} vertical={true} />
                                <XAxis type="number" tick={{ fill: 'white' }} />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    tick={{ fill: 'white', fontSize: 11 }} 
                                    width={140}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF' }} 
                                    cursor={{ fill: 'rgba(255, 65, 54, 0.1)' }}
                                />
                                <Legend />
                                {/* Changed Inscritos color to Red for attention */}
                                <Bar dataKey="Inscritos" fill="#FF4136" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="Capacidad" fill="#00B7FF" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- FINANCIAL CHART (Full Width) --- */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-4 text-white">Ingresos vs Gastos Mensuales</h3>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sortedMonthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568"/>
                            <XAxis dataKey="month" tick={{ fill: 'white' }} />
                            <YAxis tick={{ fill: 'white' }} tickFormatter={(value) => `€${Number(value).toLocaleString('es-ES')}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF' }} 
                                cursor={{ fill: 'rgba(124, 0, 186, 0.1)' }}
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="Ingresos" stroke="#7C00BA" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="Gastos" stroke="#FF4136" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-4 text-white">Resumen Financiero</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={financialSummaryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {financialSummaryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_FINANCIAL[index % COLORS_FINANCIAL.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF' }}
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-4 text-white">Estado de Alumnos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={studentStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                 {studentStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-4 text-white">Alumnos por Categoría</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={classPopularityData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis type="number" tick={{ fill: 'white' }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: 'white' }} width={100} interval={0} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF' }} cursor={{ fill: 'rgba(124, 0, 186, 0.1)' }}/>
                            <Legend />
                            <Bar dataKey="Alumnos" fill="#7C00BA" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-4 text-white">Alumnos con Pagos Pendientes ({currentYear})</h3>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Alumno</th>
                                    <th scope="col" className="px-6 py-3">Meses Pendientes</th>
                                    <th scope="col" className="px-6 py-3 text-right">Total Adeudado</th>
                                    <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unpaidStudentsInfo.length > 0 ? (
                                    unpaidStudentsInfo.map((info, index) => (
                                        <tr key={index} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{info.name}</td>
                                            <td className="px-6 py-4">{info.unpaidMonths.join(', ')}</td>
                                            <td className="px-6 py-4 text-right font-bold text-red-400">€{info.totalDebt.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => handleWhatsAppReminder(info)}
                                                    className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700 flex items-center justify-center mx-auto transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                                    title={info.phone ? "Enviar recordatorio por WhatsApp" : "No hay teléfono registrado"}
                                                    disabled={!info.phone}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-whatsapp mr-1.5" viewBox="0 0 16 16">
                                                        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                                                    </svg>
                                                    <span>Recordar</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                            ¡Genial! No hay pagos pendientes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm flex flex-col">
                    <h3 className="font-semibold mb-4 text-white">Próximos Cumpleaños</h3>
                    <div className="overflow-y-auto max-h-96 flex-grow">
                        {upcomingBirthdays.length > 0 ? (
                            <ul className="space-y-3">
                                {upcomingBirthdays.map((b, index) => (
                                    <li key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-md">
                                        <div className="flex items-center">
                                            <div className="bg-purple-500/20 text-purple-400 rounded-full p-2 mr-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 01-2-2H4a2 2 0 01-2-2V6z" />
                                                    <path fillRule="evenodd" d="M2 13.5V7h16v6.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 13.5zM4 11h1v1H4v-1zm2 0h1v1H6v-1zm2 0h1v1H8v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{b.name}</p>
                                                <p className="text-xs text-gray-400">Cumple {b.age} años</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-purple-300 capitalize">
                                            {new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(b.birthday)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="flex items-center justify-center h-full">
                                <p className="text-center text-gray-500 py-4">No hay cumpleaños en los próximos 7 días.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
