
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Student, DanceClass, Instructor, Payment, Cost, View, NuptialDance } from '../types';

interface DashboardProps {
  students: Student[];
  classes: DanceClass[];
  instructors: Instructor[];
  payments: Payment[];
  costs: Cost[];
  nuptialDances: NuptialDance[];
  setView: (view: View) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; subtext?: string; color?: string; children: React.ReactNode; onClick?: () => void; }> = ({ title, value, subtext, color = "purple", children, onClick }) => {
    // Mapeo seguro de colores para Tailwind (evita purgado de clases)
    const colorClasses: Record<string, { bg: string, text: string }> = {
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
        green: { bg: 'bg-green-500/10', text: 'text-green-400' },
        red: { bg: 'bg-red-500/10', text: 'text-red-400' },
        pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
        yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    };

    const activeColor = colorClasses[color] || colorClasses['purple'];

    const cardContent = (
        <div className={`
            bg-gray-800 p-6 rounded-2xl w-full h-full flex items-center
            /* Neumorphism Shadow: Dark shadow bottom-right, Light glow top-left */
            shadow-[6px_6px_12px_#111827,-4px_-4px_12px_#374151]
            border border-gray-700/20
            transition-all duration-300 ease-in-out
            ${onClick ? 'group hover:-translate-y-1 hover:shadow-[8px_8px_16px_#111827,-6px_-6px_16px_#374151]' : ''}
        `}>
            {/* Icon Container with Inner Shadow */}
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

const Dashboard: React.FC<DashboardProps> = ({ students, classes, payments, instructors, costs, nuptialDances, setView }) => {
    const totalStudents = students.length;
    
    // Revenue Calculation
    const totalRegularRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalNuptialRevenue = nuptialDances.reduce((acc, d) => acc + (d.paidAmount || 0), 0);
    const totalRevenue = totalRegularRevenue + totalNuptialRevenue;
    const totalCosts = costs.reduce((acc, c) => acc + c.amount, 0);

    // --- KPIs Calculations ---
    
    // 1. New Students this month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const newStudentsCount = students.filter(s => {
        const d = new Date(s.enrollmentDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // 2. Global Occupancy Rate
    const totalCapacity = classes.reduce((acc, c) => acc + c.capacity, 0);
    const totalEnrollments = classes.reduce((acc, c) => {
        const count = students.filter(s => s.enrolledClassIds.includes(c.id)).length;
        return acc + count;
    }, 0);
    const occupancyRate = totalCapacity > 0 ? ((totalEnrollments / totalCapacity) * 100).toFixed(1) : '0';

    // 3. Unpaid Students Logic
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

            for (let monthIndex = startMonth; monthIndex <= currentMonth; monthIndex++) {
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

            return { name: student.name, phone: student.phone, unpaidMonths, totalDebt };
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
        const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    // --- Chart Data Preparation ---

    // 1. Class Enrollment (Horizontal Bar)
    const classEnrollmentData = classes
        .map(c => ({
            name: c.name,
            Inscritos: students.filter(s => s.enrolledClassIds.includes(c.id)).length,
            Capacidad: c.capacity,
            Ocupacion: c.capacity > 0 ? (students.filter(s => s.enrolledClassIds.includes(c.id)).length / c.capacity) * 100 : 0
        }))
        .sort((a, b) => b.Inscritos - a.Inscritos)
        .slice(0, 10); // Top 10 classes

    // 2. Financials (Area Chart)
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
            acc[key] = { month: `${month}`, Ingresos: 0, Gastos: 0, monthIndex: date.getMonth(), year: year };
        }

        if (item.type === 'income') {
            acc[key].Ingresos += item.amount;
        } else {
            acc[key].Gastos += item.amount;
        }
        
        return acc;
    }, initialMonthlyData);

    const sortedMonthlyData = Object.values(monthlyData).sort((a: MonthlyData, b: MonthlyData) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIndex - b.monthIndex;
    });

    // 3. Age Distribution (Bar Chart)
    const ageGroups = {
        'Infantil (3-11)': 0,
        'Junior (12-17)': 0,
        'Adultos (18-60)': 0,
        'Senior (60+)': 0
    };

    students.forEach(s => {
        if (s.birthDate && s.active) {
            const birthDate = new Date(s.birthDate);
            const age = new Date().getFullYear() - birthDate.getFullYear();
            if (age <= 11) ageGroups['Infantil (3-11)']++;
            else if (age <= 17) ageGroups['Junior (12-17)']++;
            else if (age <= 60) ageGroups['Adultos (18-60)']++;
            else ageGroups['Senior (60+)']++;
        }
    });

    const ageDistributionData = Object.entries(ageGroups).map(([name, value]) => ({ name, Alumnos: value }));

    // 4. Top Instructors (Bar Chart)
    const instructorPopularityData = instructors.map(inst => {
        const theirClasses = classes.filter(c => c.instructorId === inst.id);
        const totalStudents = theirClasses.reduce((acc, c) => {
            return acc + students.filter(s => s.enrolledClassIds.includes(c.id)).length;
        }, 0);
        return { name: inst.name, Alumnos: totalStudents };
    })
    .sort((a, b) => b.Alumnos - a.Alumnos)
    .slice(0, 5);

    // 5. Pie Charts Data
    const financialSummaryData = [
        { name: 'Ingresos', value: totalRevenue },
        { name: 'Costes', value: totalCosts },
    ];
    const activeStudentsCount = students.filter(s => s.active).length;
    const studentStatusData = [
        { name: 'Activos', value: activeStudentsCount },
        { name: 'Inactivos', value: students.length - activeStudentsCount },
    ];

    // --- Upcoming Birthdays ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingBirthdays = students
      .filter(student => student.active && student.birthDate)
      .map(student => {
        const birthDate = new Date(student.birthDate);
        const thisYearBirthday = new Date(birthDate.getTime());
        thisYearBirthday.setFullYear(today.getFullYear());
        thisYearBirthday.setHours(0,0,0,0);
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        const age = thisYearBirthday.getFullYear() - birthDate.getFullYear();
        return { name: student.name, birthday: thisYearBirthday, age };
      })
      .filter(b => {
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
        return b.birthday >= today && b.birthday <= sevenDaysFromNow;
      })
      .sort((a, b) => a.birthday.getTime() - b.birthday.getTime());


    const COLORS_FINANCIAL = ['#8B5CF6', '#EF4444'];
    const COLORS_STATUS = ['#10B981', '#4B5563'];
    const COLORS_AGE = ['#F472B6', '#8B5CF6', '#3B82F6', '#10B981'];
    
    const formatCurrency = (value: number) => `€${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Estilo común para contenedores de gráficos
    const containerClass = "bg-gray-800 p-6 rounded-2xl shadow-[5px_5px_15px_#111827,-2px_-2px_10px_#374151] border border-gray-700/30";

    return (
        <div className="p-4 sm:p-8 space-y-8 pb-20">
            <h2 className="text-3xl font-bold mb-4">Dashboard General</h2>
            
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <StatCard title="Total Alumnos" value={totalStudents} color="blue" onClick={() => setView(View.STUDENTS)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </StatCard>
                <StatCard title="Nuevos (Mes)" value={newStudentsCount} subtext="Crecimiento mensual" color="green">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </StatCard>
                 <StatCard title="Ocupación Global" value={`${occupancyRate}%`} subtext="Capacidad utilizada" color="pink">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </StatCard>
                <StatCard title="Ingresos Totales" value={`€${totalRevenue.toLocaleString('es-ES', { notation: "compact" })}`} color="purple" onClick={() => setView(View.BILLING)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
                </StatCard>
                <StatCard title="Pendiente Cobro" value={`€${totalPendingAmount.toLocaleString('es-ES')}`} color="red">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </StatCard>
                <StatCard title="Profesores" value={instructors.length} color="blue" onClick={() => setView(View.INSTRUCTORS)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </StatCard>
            </div>

            {/* MAIN CHARTS ROW 1: Classes & Finances */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></span>
                        Top 10 Clases Más Populares
                    </h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={classEnrollmentData} 
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} vertical={true} />
                                <XAxis type="number" tick={{ fill: '#9ca3af' }} />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    tick={{ fill: '#D1D5DB', fontSize: 11 }} 
                                    width={140}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                                    cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                                />
                                <Bar dataKey="Inscritos" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                         <span className="w-2 h-6 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></span>
                         Evolución Financiera (Año actual)
                    </h3>
                     <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={sortedMonthlyData}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                            <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} />
                            <YAxis tick={{ fill: '#9ca3af' }} tickFormatter={(value) => `€${Number(value).toLocaleString('es-ES', { notation: "compact" })}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                                formatter={(value: number) => formatCurrency(value)}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="Ingresos" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="Gastos" stroke="#EF4444" fillOpacity={1} fill="url(#colorCost)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* MAIN CHARTS ROW 2: Demographics & Instructors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
                        Demografía: Distribución por Edad
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ageDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#9ca3af' }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF', borderRadius: '8px' }} 
                                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                            />
                            <Bar dataKey="Alumnos" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                                {ageDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_AGE[index % COLORS_AGE.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899]"></span>
                        Top 5 Profesores (por nº alumnos)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={instructorPopularityData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#9ca3af' }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#D1D5DB', fontSize: 12 }} width={100} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF', borderRadius: '8px' }} 
                                cursor={{ fill: 'rgba(236, 72, 153, 0.1)' }}
                            />
                            <Bar dataKey="Alumnos" fill="#EC4899" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* SMALLER CHARTS & LISTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white">Resumen Financiero Total</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={financialSummaryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {financialSummaryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_FINANCIAL[index % COLORS_FINANCIAL.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF', borderRadius: '8px' }}
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white">Estado de Matrículas</h3>
                    <ResponsiveContainer width="100%" height={250}>
                         <PieChart>
                            <Pie data={studentStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                                 {studentStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#FFFFFF', borderRadius: '8px' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className={`${containerClass} flex flex-col`}>
                    <h3 className="font-semibold mb-4 text-white flex items-center justify-between">
                        <span>Próximos Cumpleaños</span>
                        <span className="text-xs font-normal text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20">7 días</span>
                    </h3>
                    <div className="overflow-y-auto max-h-60 flex-grow pr-2 custom-scrollbar">
                        {upcomingBirthdays.length > 0 ? (
                            <ul className="space-y-3">
                                {upcomingBirthdays.map((b, index) => (
                                    <li key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl border border-gray-700/50 hover:bg-gray-700/50 transition-colors shadow-sm">
                                        <div className="flex items-center">
                                            <div className="bg-purple-500/20 text-purple-400 rounded-full p-2 mr-3 shadow-inner">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 002 0V6zm-5 5a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1zm10 0a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 01-1 1h-2a1 1 0 01-1-1v-1zM6 15a1 1 0 00-2 0v1a2 2 0 002 0v-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-white text-sm">{b.name}</p>
                                                <p className="text-xs text-gray-400">Cumple {b.age} años</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-purple-300 capitalize bg-purple-500/10 px-2 py-1 rounded-lg">
                                            {new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(b.birthday)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-sm">No hay cumpleaños cercanos.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

             {/* Unpaid Students Table */}
             <div className="grid grid-cols-1 gap-8">
                <div className={containerClass}>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]"></span>
                        Alumnos con Pagos Pendientes ({currentYear})
                    </h3>
                    <div className="overflow-x-auto max-h-96 rounded-xl border border-gray-700/50">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-900/80 sticky top-0 backdrop-blur-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Alumno</th>
                                    <th scope="col" className="px-6 py-4">Meses Pendientes</th>
                                    <th scope="col" className="px-6 py-4 text-right">Deuda Total</th>
                                    <th scope="col" className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {unpaidStudentsInfo.length > 0 ? (
                                    unpaidStudentsInfo.map((info, index) => (
                                        <tr key={index} className="bg-gray-800/50 hover:bg-gray-750 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{info.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {info.unpaidMonths.map(m => (
                                                        <span key={m} className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-xs border border-red-500/20">{m}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-red-400">€{info.totalDebt.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => handleWhatsAppReminder(info)}
                                                    className="bg-green-600/90 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600 flex items-center justify-center mx-auto transition-all shadow-lg shadow-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                                                    title={info.phone ? "Enviar recordatorio por WhatsApp" : "No hay teléfono registrado"}
                                                    disabled={!info.phone}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="mr-1.5" viewBox="0 0 16 16">
                                                        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                                                    </svg>
                                                    Reclamar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 flex flex-col items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-green-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            ¡Genial! No hay pagos pendientes este año.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
