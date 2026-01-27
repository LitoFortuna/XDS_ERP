import React from 'react';
import { Student, DanceClass, Payment } from '../../../../types';
import { PortalPage } from '../BottomNavigation';

interface HomePageProps {
    student: Student;
    upcomingClasses: DanceClass[];
    payments: Payment[];
    currentStreak?: number;
    level?: number;
    levelName?: string;
    levelIcon?: string;
    onNavigate?: (page: PortalPage) => void;
}

const HomePage: React.FC<HomePageProps> = ({
    student,
    upcomingClasses,
    payments,
    currentStreak = 0,
    level = 1,
    levelName = 'Principiante',
    levelIcon = '🌱',
    onNavigate
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-br from-purple-900/60 via-purple-800/40 to-fuchsia-900/60 border border-purple-500/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">¡Hola, {student.name.split(' ')[0]}! 👋</h2>
                        <p className="text-purple-200 text-sm flex items-center">
                            {levelIcon} {levelName} • Nivel {level}
                        </p>
                    </div>
                    {currentStreak > 0 && (
                        <div className="text-center bg-black/20 rounded-lg px-4 py-2">
                            <div className="text-2xl">🔥</div>
                            <div className="text-white font-bold text-lg">{currentStreak}</div>
                            <div className="text-xs text-purple-200">días</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Card */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Estado de la Cuenta</h3>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Estado</p>
                        <p className="text-white font-medium">
                            {student.active ? '✅ Matrícula Activa' : '❌ Matrícula Inactiva'}
                        </p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Cuota Mensual</p>
                        <p className="text-2xl font-bold text-white font-mono">{formatCurrency(student.monthlyFee)}</p>
                    </div>
                </div>
            </div>

            {/* Upcoming Classes */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Próximas Clases
                </h3>
                {upcomingClasses.length > 0 ? (
                    <div className="space-y-3">
                        {upcomingClasses.slice(0, 4).map((danceClass) => (
                            <div
                                key={danceClass.id}
                                className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/50 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="text-white font-semibold mb-1">{danceClass.name}</h4>
                                        <p className="text-sm text-gray-400 mb-2">{danceClass.instructorName}</p>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {danceClass.startTime} - {danceClass.endTime}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                            {danceClass.days[0]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-4">No hay clases programadas próximamente</p>
                )}
            </div>

            {/* Payment History */}
            <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    Historial de Pagos ({new Date().getFullYear()})
                </h3>
                {payments.length > 0 ? (
                    <div className="space-y-2">
                        {payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg"
                            >
                                <div>
                                    <p className="text-white font-medium">{formatCurrency(payment.amount)}</p>
                                    <p className="text-xs text-gray-400">{formatDate(payment.date)}</p>
                                </div>
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                    Pagado
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-4">No hay pagos registrados este año</p>
                )}
            </section>
        </div>
    );
};

export default HomePage;
