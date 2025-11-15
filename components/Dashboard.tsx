import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Student, DanceClass, Instructor, Payment, Cost } from '../types';

interface DashboardProps {
  students: Student[];
  classes: DanceClass[];
  instructors: Instructor[];
  payments: Payment[];
  costs: Cost[];
}

const StatCard: React.FC<{ title: string; value: string | number; children: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-sm flex items-center">
        <div className="bg-purple-500/20 text-purple-400 rounded-full p-3 mr-4">
            {children}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ students, classes, payments, instructors, costs }) => {
    const totalStudents = students.length;
    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalCosts = costs.reduce((acc, c) => acc + c.amount, 0);

    const classEnrollmentData = classes.map(c => ({
        name: c.name,
        Inscritos: students.filter(s => s.enrolledClassIds.includes(c.id)).length,
        Capacidad: c.capacity,
    }));
    
    const monthlyRevenueData = payments.reduce((acc: Record<string, { month: string; revenue: number; monthIndex: number; year: number }>, p) => {
        const date = new Date(p.date);
        const month = date.toLocaleString('es-ES', { month: 'short' });
        const year = date.getFullYear();
        const key = `${year}-${date.getMonth()}`; // Clave única por año y mes
        
        if (!acc[key]) {
            acc[key] = { month, revenue: 0, monthIndex: date.getMonth(), year: year };
        }
        acc[key].revenue += p.amount;
        
        return acc;
    }, {} as Record<string, { month: string; revenue: number; monthIndex: number; year: number }>);

    const sortedMonthlyRevenueData = Object.values(monthlyRevenueData).sort((a: { year: number; monthIndex: number; }, b: { year: number; monthIndex: number; }) => {
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

    const COLORS_FINANCIAL = ['#7C00BA', '#FF4136'];
    const COLORS_STATUS = ['#00B7FF', '#4b5563'];

    return (
        <div className="p-4 sm:p-8 space-y-8">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Alumnos" value={totalStudents}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </StatCard>
                <StatCard title="Total Clases" value={classes.length}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </StatCard>
                <StatCard title="Total Profesores" value={instructors.length}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0z" /></svg>
                </StatCard>
                <StatCard title="Ingresos Totales" value={`€${totalRevenue.toLocaleString('es-ES')}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
                </StatCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-4 text-white">Inscripciones por Clase</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={classEnrollmentData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                            <YAxis tick={{ fill: '#9ca3af' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} cursor={{ fill: 'rgba(124, 0, 186, 0.1)' }}/>
                            <Legend />
                            <Bar dataKey="Inscritos" fill="#7C00BA" />
                            <Bar dataKey="Capacidad" fill="#00B7FF" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-4 text-white">Ingresos Mensuales</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={sortedMonthlyRevenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568"/>
                            <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} />
                            <YAxis tick={{ fill: '#9ca3af' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} cursor={{ fill: 'rgba(124, 0, 186, 0.1)' }}/>
                            <Legend />
                            <Line type="monotone" dataKey="revenue" name="Ingresos" stroke="#7C00BA" strokeWidth={2} />
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
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}/>
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
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-4 text-white">Alumnos por Categoría</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={classPopularityData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis type="number" tick={{ fill: '#9ca3af' }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af' }} width={100} interval={0} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} cursor={{ fill: 'rgba(124, 0, 186, 0.1)' }}/>
                            <Legend />
                            <Bar dataKey="Alumnos" fill="#7C00BA" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
