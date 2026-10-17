import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { TeacherOverview } from '../../services/domain/teacherService';
import {
    monthlyAttendance, classAttendanceStats, studentAttendanceRates, upcomingBirthdays, classesOnDate,
} from '../../utils/teacherStats';
import { findStudentsAtRisk } from '../../utils/attendanceRisk';
import { Student, AttendanceRecord } from '../../../types';

interface TeacherDashboardProps {
    data: TeacherOverview;
    onTakeAttendance: (classId?: string) => void;
}

const CHART_TOOLTIP = { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' };

const formatShortDate = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <section className={`bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6 ${className}`}>
        <h2 className="text-base font-bold text-white mb-4">{title}</h2>
        {children}
    </section>
);

const Kpi: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{value}</p>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
);

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ data, onTakeAttendance }) => {
    const { today, classes, students, attendance, absences } = data;
    const firstName = data.instructor.name.split(' ')[0] || 'profe';

    const months = useMemo(() => monthlyAttendance(attendance, students, today, 6), [attendance, students, today]);
    const currentMonth = months[months.length - 1];
    const classStats = useMemo(() => classAttendanceStats(classes, attendance, students, today), [classes, attendance, students, today]);
    const rates = useMemo(() => studentAttendanceRates(students, attendance, today), [students, attendance, today]);
    const birthdays = useMemo(() => upcomingBirthdays(students, today, 30), [students, today]);
    const todaysClasses = useMemo(() => classesOnDate(classes, today), [classes, today]);

    // findStudentsAtRisk trabaja con la ficha completa; aquí solo hacen falta id, nombre, estado y clases.
    const atRisk = useMemo(
        () => findStudentsAtRisk(students as unknown as Student[], attendance as unknown as AttendanceRecord[]),
        [students, attendance]
    );

    const upcomingAbsences = useMemo(
        () => absences
            .filter(a => a.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date) || a.studentName.localeCompare(b.studentName, 'es'))
            .slice(0, 8),
        [absences, today]
    );
    const className = (id: string) => classes.find(c => c.id === id)?.name || 'Clase';
    const todayLabel = new Date(today + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    if (classes.length === 0) {
        return (
            <div className="max-w-xl mx-auto text-center bg-gray-800 border border-gray-700 rounded-xl p-8">
                <p className="text-4xl mb-2" aria-hidden="true">💃</p>
                <h2 className="text-xl font-bold text-white mb-2">¡Hola, {firstName}!</h2>
                <p className="text-gray-400">Todavía no tienes clases asignadas. Cuando la administración te las asigne, aquí verás tu resumen.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">¡Hola, {firstName}! 👋</h2>
                <p className="text-gray-400 first-letter:uppercase">{todayLabel}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Kpi label="Mis clases" value={classes.length} hint={`${todaysClasses.length} hoy`} />
                <Kpi label="Mis alumnas" value={students.length} hint="activas en mis clases" />
                <Kpi label="Asistencia del mes" value={currentMonth.sessions > 0 ? `${currentMonth.percent}%` : '—'} hint={currentMonth.sessions > 0 ? `${currentMonth.avgAttendees} asistentes de media` : 'Sin listas este mes'} />
                <Kpi label="Sesiones del mes" value={currentMonth.sessions} hint="listas registradas" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Hoy">
                    {todaysClasses.length === 0 ? (
                        <p className="text-sm text-gray-400">Hoy no tienes clases. ¡Buen descanso!</p>
                    ) : (
                        <ul className="space-y-3">
                            {todaysClasses.map(c => {
                                const done = attendance.some(r => r.classId === c.id && r.date === today);
                                return (
                                    <li key={c.id} className="flex items-center justify-between gap-3 bg-gray-900/50 rounded-lg p-3 border border-gray-700/60">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-white truncate">{c.name}</p>
                                            <p className="text-xs text-gray-400 font-mono">{c.startTime}–{c.endTime}</p>
                                        </div>
                                        {done ? (
                                            <span className="text-xs font-bold text-green-300 bg-green-500/15 border border-green-500/30 rounded-full px-3 py-1.5 flex-shrink-0">✓ Lista pasada</span>
                                        ) : (
                                            <button
                                                onClick={() => onTakeAttendance(c.id)}
                                                className="flex-shrink-0 min-h-[40px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg px-4"
                                            >
                                                Pasar lista
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>

                <Card title="Cumpleaños de mis alumnas (30 días)">
                    {birthdays.length === 0 ? (
                        <p className="text-sm text-gray-400">No hay cumpleaños en los próximos 30 días.</p>
                    ) : (
                        <ul className="space-y-2">
                            {birthdays.map(b => (
                                <li key={b.studentId} className="flex items-center justify-between gap-3 bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-2">
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-pink-50 truncate">🎂 {b.name}</span>
                                        <span className="block text-xs text-pink-200/80">Cumple {b.turns} años</span>
                                    </span>
                                    <span className="text-xs font-bold text-pink-200 flex-shrink-0">
                                        {b.daysUntil === 0 ? '¡Hoy!' : b.daysUntil === 1 ? 'Mañana' : formatShortDate(b.date)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Asistencia por mes (% de inscritas)">
                    {months.every(m => m.sessions === 0) ? (
                        <p className="text-sm text-gray-400">Aún no hay listas registradas en estos meses.</p>
                    ) : (
                        <div className="h-64" role="img" aria-label={`Porcentaje de asistencia mensual: ${months.map(m => `${m.label} ${m.percent}%`).join(', ')}`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={months} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
                                    <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} unit="%" />
                                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(value: number, _n, item) => [`${value}% (${(item.payload as { sessions: number }).sessions} sesiones)`, 'Asistencia']} />
                                    <Line type="monotone" dataKey="percent" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4, fill: '#a78bfa' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>

                <Card title="Asistentes por clase (últimos 90 días)">
                    {classStats.every(c => c.sessions === 0) ? (
                        <p className="text-sm text-gray-400">Aún no hay listas registradas en los últimos 90 días.</p>
                    ) : (
                        <div className="h-64" role="img" aria-label={`Asistentes de media por clase: ${classStats.map(c => `${c.name} ${c.avgAttendees} de ${c.enrolled}`).join(', ')}`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classStats} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} interval={0} tickFormatter={(v: string) => (v.length > 10 ? v.slice(0, 9) + '…' : v)} />
                                    <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                                    <Tooltip contentStyle={CHART_TOOLTIP} />
                                    <Bar dataKey="enrolled" name="Inscritas" fill="#4b5563" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="avgAttendees" name="Asisten de media" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Alumnas más constantes">
                    {rates.length === 0 ? (
                        <p className="text-sm text-gray-400">Hacen falta al menos 3 sesiones registradas para calcularlo.</p>
                    ) : (
                        <ol className="space-y-2">
                            {rates.slice(0, 5).map((r, i) => (
                                <li key={r.studentId} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="truncate text-gray-200"><span className="text-gray-500 mr-2">{i + 1}.</span>{r.name}</span>
                                    <span className="font-bold text-green-300 flex-shrink-0">{r.percent}%</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </Card>

                <Card title="Atención: faltas seguidas">
                    {atRisk.length === 0 ? (
                        <p className="text-sm text-gray-400">Nadie ha faltado a sus últimas 3 clases seguidas. 👏</p>
                    ) : (
                        <ul className="space-y-2">
                            {atRisk.slice(0, 6).map(r => (
                                <li key={r.studentId} className="flex items-center justify-between gap-3 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                                    <span className="truncate text-amber-50">{r.studentName}</span>
                                    <span className="text-xs font-bold text-amber-300 flex-shrink-0">{r.missedStreak} seguidas</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card title="Han avisado que no vienen">
                    {upcomingAbsences.length === 0 ? (
                        <p className="text-sm text-gray-400">No hay avisos de ausencia próximos.</p>
                    ) : (
                        <ul className="space-y-2">
                            {upcomingAbsences.map(a => (
                                <li key={a.id} className="text-sm">
                                    <span className="block text-gray-100 truncate">{a.studentName}</span>
                                    <span className="block text-xs text-gray-400">{className(a.classId)} · {formatShortDate(a.date)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default TeacherDashboard;
