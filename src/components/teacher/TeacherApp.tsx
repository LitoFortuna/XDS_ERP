import React, { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTeacherOverview, TeacherOverview } from '../../services/domain/teacherService';
import ChangePasswordModal from './ChangePasswordModal';

const TeacherDashboard = lazy(() => import('./TeacherDashboard'));
const TeacherAttendance = lazy(() => import('./TeacherAttendance'));
const TeacherSchedule = lazy(() => import('./TeacherSchedule'));

export type TeacherTab = 'dashboard' | 'attendance' | 'schedule';

const TABS: { id: TeacherTab; label: string; icon: React.ReactNode }[] = [
    {
        id: 'dashboard',
        label: 'Resumen',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    },
    {
        id: 'attendance',
        label: 'Asistencia',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    },
    {
        id: 'schedule',
        label: 'Horario y clases',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    },
];

interface TeacherAppProps {
    email: string;
    onLogout: () => void;
}

// Panel de profesor: una aplicación aparte del ERP de administración (no comparte pantallas ni
// estado con él). Solo recibe, vía la Cloud Function teacherOverview, sus clases y sus alumnas.
const TeacherApp: React.FC<TeacherAppProps> = ({ email, onLogout }) => {
    const [tab, setTab] = useState<TeacherTab>('dashboard');
    const [attendanceClassId, setAttendanceClassId] = useState<string | undefined>(undefined);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery<TeacherOverview>({
        queryKey: ['teacherOverview'],
        queryFn: fetchTeacherOverview,
        staleTime: 1000 * 60 * 2,
        retry: 1,
    });

    const goToAttendance = (classId?: string) => {
        setAttendanceClassId(classId);
        setTab('attendance');
    };

    const errorCode = (error as { code?: string } | null)?.code || '';
    const accessRevoked = errorCode.includes('permission-denied') || errorCode.includes('unauthenticated');

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans pb-24 md:pb-8">
            <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <img src="/pwa-192x192.png" alt="" width={40} height={40} className="w-10 h-10 rounded-lg flex-shrink-0" />
                        <div className="min-w-0">
                            <h1 className="font-bold text-white leading-tight truncate">Panel de profesor</h1>
                            <p className="text-xs text-gray-400 truncate">{data?.instructor.name || email}</p>
                        </div>
                    </div>

                    <nav aria-label="Secciones" className="hidden md:flex items-center gap-1">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                aria-current={tab === t.id ? 'page' : undefined}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            aria-label="Cambiar mi contraseña"
                            title="Cambiar mi contraseña"
                            className="text-sm font-medium text-gray-300 hover:text-white px-2.5 py-2.5 rounded-lg flex items-center gap-1.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            <span className="hidden sm:inline">Contraseña</span>
                        </button>
                        <button
                            onClick={onLogout}
                            className="text-sm font-medium text-red-400 hover:text-red-300 px-2.5 py-2.5 rounded-lg"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                {isLoading && (
                    <div className="flex justify-center py-16" role="status" aria-label="Cargando">
                        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin" />
                    </div>
                )}

                {isError && (
                    <div role="alert" className="bg-red-900/30 border border-red-500/40 text-red-100 rounded-xl p-5 max-w-xl mx-auto text-center">
                        <p className="font-semibold mb-1">{accessRevoked ? 'Tu acceso ya no está activo' : 'No se han podido cargar tus datos'}</p>
                        <p className="text-sm text-red-200/90 mb-4">
                            {accessRevoked
                                ? 'Contacta con la administración de la academia para que lo revise.'
                                : 'Comprueba tu conexión e inténtalo de nuevo.'}
                        </p>
                        {!accessRevoked && (
                            <button onClick={() => refetch()} className="bg-red-800/60 hover:bg-red-800 text-white px-4 py-2.5 rounded-lg font-medium">
                                Reintentar
                            </button>
                        )}
                    </div>
                )}

                {data && (
                    <Suspense fallback={<div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin" /></div>}>
                        {tab === 'dashboard' && <TeacherDashboard data={data} onTakeAttendance={goToAttendance} onViewEvents={() => setTab('schedule')} />}
                        {tab === 'attendance' && (
                            <TeacherAttendance
                                data={data}
                                initialClassId={attendanceClassId}
                                onSaved={() => refetch()}
                                isRefreshing={isFetching}
                            />
                        )}
                        {tab === 'schedule' && <TeacherSchedule data={data} onTakeAttendance={goToAttendance} />}
                    </Suspense>
                )}
            </main>

            <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />

            <nav aria-label="Secciones" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-gray-800 border-t border-gray-700 pb-[env(safe-area-inset-bottom)]">
                <ul className="flex">
                    {TABS.map(t => (
                        <li key={t.id} className="flex-1">
                            <button
                                onClick={() => setTab(t.id)}
                                aria-current={tab === t.id ? 'page' : undefined}
                                className={`w-full flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold touch-manipulation ${tab === t.id ? 'text-purple-300' : 'text-gray-400'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">{t.icon}</svg>
                                {t.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default TeacherApp;
