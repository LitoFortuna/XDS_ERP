import React, { useEffect, useState } from 'react';
import { StudentProgress, Student, DanceClass } from '../../../types';
import { getStudentProgress, getLevelInfo, getProgressToNextLevel, AVAILABLE_BADGES, LEVELS } from '../../../services/progressService';

interface ProgressDashboardProps {
    student: Student;
    attendanceRecords: any[];
    allClasses: DanceClass[];
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ student, attendanceRecords, allClasses }) => {
    const [progress, setProgress] = useState<StudentProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProgress = async () => {
            try {
                const studentProgress = await getStudentProgress(student.id);
                setProgress(studentProgress);
            } catch (error) {
                console.error('[ProgressDashboard] Error loading progress:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProgress();
    }, [student.id]);

    if (isLoading || !progress) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    // Calculate total hours (assuming 1 hour per class for now)
    const clientTotalHours = attendanceRecords.length;

    // Calculate estimated points client-side (Base 10 pts per class)
    // This provides instant feedback even if the backend background job hasn't finished
    const clientPointsBase = attendanceRecords.length * 10;
    // Add badge points if we unlock them client-side
    // (Simple approximation: First Class = 50pts, others vary. Let's just assume base + 50 if attended > 0 for First Class)
    const clientPointsWithBadges = clientPointsBase + (attendanceRecords.length > 0 ? 50 : 0);

    const displayPoints = Math.max(progress.points, clientPointsWithBadges);

    const levelInfo = getLevelInfo(displayPoints);
    const levelProgress = getProgressToNextLevel(displayPoints);

    // Merge badges logic: If we have attendance but missing 'first_class' badge, show it as unlocked
    let unlockedBadges = AVAILABLE_BADGES.filter(badge =>
        progress.achievements.some(a => a.badgeId === badge.id)
    );
    let lockedBadges = AVAILABLE_BADGES.filter(badge =>
        !progress.achievements.some(a => a.badgeId === badge.id)
    );

    if (attendanceRecords.length > 0) {
        // Check if first_class is already unlocked logic
        const hasFirstClass = unlockedBadges.some(b => b.id === 'first_class');
        if (!hasFirstClass) {
            const firstClassBadge = AVAILABLE_BADGES.find(b => b.id === 'first_class');
            if (firstClassBadge) {
                unlockedBadges = [firstClassBadge, ...unlockedBadges];
                lockedBadges = lockedBadges.filter(b => b.id !== 'first_class');
            }
        }
    }

    // Calculate stats from real-time attendanceRecords prop first, as fallback or override
    // This ensures that if the query works, the UI reflects it immediately
    const currentYearStr = new Date().getFullYear().toString();
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

    const realAttendanceCountYear = attendanceRecords.filter(r => r.date.startsWith(currentYearStr)).length;
    const realAttendanceCountMonth = attendanceRecords.filter(r => r.date.startsWith(currentMonth)).length;

    // Calculate streak client-side to be instant
    const sortedDates = attendanceRecords.map(r => new Date(r.date).getTime()).sort((a, b) => b - a);
    let clientStreak = 0;
    if (sortedDates.length > 0) {
        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = today - 86400000;
        const lastDate = new Date(sortedDates[0]).setHours(0, 0, 0, 0);

        if (lastDate === today || lastDate === yesterday) {
            clientStreak = 1;
            for (let i = 0; i < sortedDates.length - 1; i++) {
                const curr = new Date(sortedDates[i]).setHours(0, 0, 0, 0);
                const prev = new Date(sortedDates[i + 1]).setHours(0, 0, 0, 0);
                if (curr - prev === 86400000) clientStreak++;
                else if (curr - prev > 86400000) break;
            }
        }
    }

    // Get current month stats (merge with real count)
    const storedMonthStats = progress.monthlyStats[currentMonth] || { attended: 0, total: 0, percentage: 0 };
    const thisMonthStats = {
        ...storedMonthStats,
        attended: Math.max(storedMonthStats.attended, realAttendanceCountMonth), // Use the higher value
        percentage: storedMonthStats.total > 0 ? Math.round((Math.max(storedMonthStats.attended, realAttendanceCountMonth) / storedMonthStats.total) * 100) : 0
    };

    // Calculate year stats
    // Note: progress.monthlyStats values are objects { attended: number, total: number, ... }
    const monthlyStatsEntries = Object.entries(progress.monthlyStats);

    // Sum up attended from stats
    const statsAttendedSum = monthlyStatsEntries
        .filter(([month]) => month.startsWith(currentYearStr))
        .reduce((acc, [, stats]) => acc + (stats as any).attended, 0); // specific casting or typed properly in types.ts

    // Sum up total from stats
    const statsTotalSum = monthlyStatsEntries
        .filter(([month]) => month.startsWith(currentYearStr))
        .reduce((acc, [, stats]) => acc + (stats as any).total, 0);

    const yearStats = {
        attended: Math.max(
            realAttendanceCountYear,
            statsAttendedSum
        ),
        total: Math.max(
            statsTotalSum,
            realAttendanceCountYear // Ensure total is at least equal to attended
        )
    };
    const yearPercentage = yearStats.total > 0 ? Math.round((yearStats.attended / yearStats.total) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-4xl">
                            {levelInfo.icon}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{student.name}</h2>
                            <p className="text-purple-100">Nivel {levelInfo.level}: {levelInfo.name}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center space-x-2 text-2xl mb-1">
                            <span>🔥</span>
                            <span className="font-bold">{Math.max(progress.currentStreak, clientStreak)}</span>
                            <span className="text-sm text-purple-100">días</span>
                        </div>
                        <p className="text-xs text-purple-100">Récord: {progress.recordStreak} días</p>
                    </div>
                </div>

                {/* Level Progress Bar */}
                <div className="mt-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span>Progreso al Nivel {levelInfo.level + 1}</span>
                        <span className="font-bold">{Math.round(levelProgress.percentage)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                        <div
                            className="bg-white rounded-full h-3 transition-all duration-500"
                            style={{ width: `${levelProgress.percentage}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-purple-100 mt-1">
                        {displayPoints} pts • {levelProgress.next - levelProgress.current} pts para siguiente nivel
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* This Month */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Este Mes</span>
                        <span className="text-2xl">📅</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        {thisMonthStats.attended}/{Math.max(thisMonthStats.total, thisMonthStats.attended)}
                    </div>
                    <div className="flex items-center">
                        <span className={`text-lg font-bold ${thisMonthStats.percentage >= 85 ? 'text-green-400' : thisMonthStats.percentage >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {thisMonthStats.attended > 0 && thisMonthStats.total === 0 ? '100' : thisMonthStats.percentage}%
                        </span>
                        <span className="text-xs text-gray-500 ml-2">asistencia</span>
                    </div>
                </div>

                {/* This Year */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Este Año</span>
                        <span className="text-2xl">✨</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        {yearPercentage}%
                    </div>
                    <div className="text-xs text-gray-500">
                        {yearStats.attended} clases asistidas
                    </div>
                </div>

                {/* Total Hours */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Horas Totales</span>
                        <span className="text-2xl">🎯</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        {Math.max(progress.totalHours, clientTotalHours)}h
                    </div>
                    <div className="text-xs text-gray-500">
                        desde {new Date(student.enrollmentDate).getFullYear()}
                    </div>
                </div>

                {/* Current Streak */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Racha Actual</span>
                        <span className="text-2xl">🔥</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        {progress.currentStreak} días
                    </div>
                    <div className="text-xs text-gray-500">
                        Récord: {progress.recordStreak}
                    </div>
                </div>
            </div>

            {/* Badges Section */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Logros Desbloqueados</h3>
                    <span className="text-sm text-gray-400">
                        {unlockedBadges.length}/{AVAILABLE_BADGES.length}
                    </span>
                </div>

                {/* Unlocked Badges */}
                {unlockedBadges.length > 0 && (
                    <div className="mb-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {unlockedBadges.map(badge => {
                                const achievement = progress.achievements.find(a => a.badgeId === badge.id);
                                return (
                                    <div
                                        key={badge.id}
                                        className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-4 border border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer group"
                                        title={`${badge.description}\nDesbloqueado: ${new Date(achievement?.unlockedDate || '').toLocaleDateString('es-ES')}`}
                                    >
                                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                                            {badge.icon}
                                        </div>
                                        <p className="text-white text-sm font-bold mb-1">{badge.name}</p>
                                        <p className="text-xs text-gray-400 line-clamp-2">{badge.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Locked Badges */}
                {lockedBadges.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-3">Próximos Logros</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {lockedBadges.map(badge => (
                                <div
                                    key={badge.id}
                                    className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 opacity-50 cursor-not-allowed"
                                    title={badge.description}
                                >
                                    <div className="text-4xl mb-2 grayscale">
                                        {badge.icon}
                                    </div>
                                    <p className="text-gray-500 text-sm font-bold mb-1">{badge.name}</p>
                                    <p className="text-xs text-gray-600 line-clamp-2">{badge.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {unlockedBadges.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-4xl mb-3">🎯</p>
                        <p>¡Asiste a clases para desbloquear tus primeros logros!</p>
                    </div>
                )}
            </div>

            {/* Recent Attendance History */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Historial de Asistencia</h3>

                {attendanceRecords.length > 0 ? (
                    <div className="space-y-3">
                        {attendanceRecords.slice(0, 10).map((record) => {
                            const classInfo = allClasses.find(c => c.id === record.classId);
                            const date = new Date(record.date);
                            const isToday = new Date().toDateString() === date.toDateString();

                            return (
                                <div key={record.id} className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between border border-gray-600 hover:border-purple-500 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isToday ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                            {isToday ? '✅' : '📅'}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white">
                                                {classInfo?.name || 'Clase'}
                                            </h4>
                                            <div className="flex items-center text-sm text-gray-400 space-x-3">
                                                <span>{date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                                <span>•</span>
                                                <span>{classInfo?.startTime || 'Hora no disponible'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Asistido
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {attendanceRecords.length > 10 && (
                            <div className="text-center pt-2">
                                <span className="text-sm text-gray-500">Mostrando últimas 10 asistencias</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-700/30 rounded-lg">
                        <p className="text-4xl mb-3">📅</p>
                        <p>No hay registros de asistencia recientes</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressDashboard;
