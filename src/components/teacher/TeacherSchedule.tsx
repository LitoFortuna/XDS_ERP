import React, { useMemo, useState } from 'react';
import { TeacherOverview } from '../../services/domain/teacherService';
import { classAttendanceStats, weekdayName } from '../../utils/teacherStats';
import { downloadWeeklyClassesIcs } from '../../utils/icsExport';
import TeacherEventCard from './TeacherEventCard';

interface TeacherScheduleProps {
    data: TeacherOverview;
    onTakeAttendance: (classId?: string) => void;
}

const WEEK_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const ageOf = (birthDate: string | undefined, todayIso: string): number | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate || '');
    if (!match) return null;
    const y = Number(todayIso.slice(0, 4));
    const m = Number(todayIso.slice(5, 7));
    const d = Number(todayIso.slice(8, 10));
    const age = y - Number(match[1]) - (m < Number(match[2]) || (m === Number(match[2]) && d < Number(match[3])) ? 1 : 0);
    return age >= 0 && age < 120 ? age : null;
};

const TeacherSchedule: React.FC<TeacherScheduleProps> = ({ data, onTakeAttendance }) => {
    const { today, classes, students, attendance, events } = data;
    const [openClassId, setOpenClassId] = useState<string | null>(null);
    const todayName = weekdayName(today);

    const byDay = useMemo(() => WEEK_ORDER
        .map(day => ({ day, items: classes.filter(c => c.days.includes(day)).sort((a, b) => a.startTime.localeCompare(b.startTime)) }))
        .filter(g => g.items.length > 0), [classes]);
    const stats = useMemo(() => new Map(classAttendanceStats(classes, attendance, students, today).map(s => [s.classId, s])), [classes, attendance, students, today]);

    if (classes.length === 0) {
        return (
            <div className="max-w-xl mx-auto text-center bg-gray-800 border border-gray-700 rounded-xl p-8">
                <p className="text-gray-400">Todavía no tienes clases asignadas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Horario y clases</h2>
                    <p className="text-gray-400 text-sm">Tus clases de la semana y las alumnas de cada una.</p>
                </div>
                <button
                    onClick={() => downloadWeeklyClassesIcs(classes.map(c => ({ id: c.id, name: c.name, days: c.days, startTime: c.startTime, endTime: c.endTime })))}
                    className="min-h-[44px] px-4 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/40 text-purple-100 text-sm font-semibold"
                >
                    Añadir a mi calendario
                </button>
            </div>

            <section aria-label="Horario semanal" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {byDay.map(({ day, items }) => (
                    <div key={day} className={`rounded-xl border p-4 ${day === todayName ? 'border-purple-400/60 bg-purple-500/10' : 'border-gray-700 bg-gray-800'}`}>
                        <p className={`text-xs font-black uppercase tracking-widest mb-3 ${day === todayName ? 'text-purple-300' : 'text-gray-400'}`}>
                            {day}{day === todayName && ' · hoy'}
                        </p>
                        <ul className="space-y-2">
                            {items.map(c => (
                                <li key={c.id} className="flex items-baseline gap-3">
                                    <span className="font-mono text-sm text-purple-200 flex-shrink-0 w-[5.5rem]">{c.startTime}–{c.endTime}</span>
                                    <span className="text-white font-semibold text-sm break-words">{c.name}{c.groupName && <span className="text-purple-300 font-normal"> · {c.groupName}</span>}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>

            <section aria-label="Próximos eventos" className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6">
                <h3 className="text-base font-bold text-white mb-4">Próximos eventos</h3>
                {events.length === 0 ? (
                    <p className="text-sm text-gray-400">No hay eventos programados por ahora.</p>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {events.map(ev => <TeacherEventCard key={ev.id} event={ev} today={today} showStudents />)}
                    </div>
                )}
            </section>

            <section aria-label="Mis clases" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {classes.map(c => {
                    const stat = stats.get(c.id);
                    const roster = students.filter(s => s.enrolledClassIds.includes(c.id)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
                    const occupancy = c.capacity > 0 ? Math.min(100, Math.round((roster.length / c.capacity) * 100)) : 0;
                    const isOpen = openClassId === c.id;
                    return (
                        <article key={c.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-white break-words">{c.name}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{c.category}{c.groupName && <span className="text-purple-300"> · Grupo: {c.groupName}</span>}</p>
                                </div>
                                <button
                                    onClick={() => onTakeAttendance(c.id)}
                                    className="flex-shrink-0 min-h-[40px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg px-4"
                                >
                                    Pasar lista
                                </button>
                            </div>
                            <p className="text-sm text-gray-300 mt-3">{c.days.join(' · ')} <span className="text-gray-400 font-mono">· {c.startTime}–{c.endTime}</span></p>

                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>{roster.length} de {c.capacity} plazas</span>
                                    <span>{occupancy}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-700 overflow-hidden" role="progressbar" aria-valuenow={occupancy} aria-valuemin={0} aria-valuemax={100} aria-label={`Ocupación de ${c.name}`}>
                                    <div className="h-full bg-purple-500" style={{ width: `${occupancy}%` }} />
                                </div>
                                {stat && stat.sessions > 0 && (
                                    <p className="text-xs text-gray-400 mt-2">Asisten de media {stat.avgAttendees} ({stat.percent}%) · {stat.sessions} sesiones en 90 días</p>
                                )}
                            </div>

                            <button
                                onClick={() => setOpenClassId(isOpen ? null : c.id)}
                                aria-expanded={isOpen}
                                className="mt-3 w-full min-h-[44px] text-sm font-semibold text-gray-200 bg-gray-700/60 hover:bg-gray-700 rounded-lg"
                            >
                                {isOpen ? 'Ocultar alumnas' : `Ver alumnas (${roster.length})`}
                            </button>
                            {isOpen && (
                                roster.length === 0 ? (
                                    <p className="text-sm text-gray-400 mt-3">No hay alumnas activas inscritas.</p>
                                ) : (
                                    <ul className="mt-3 divide-y divide-gray-700/60">
                                        {roster.map(s => {
                                            const age = ageOf(s.birthDate, today);
                                            return (
                                                <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                                    <span className="text-gray-100 truncate">{s.name}</span>
                                                    {age !== null && <span className="text-xs text-gray-400 flex-shrink-0">{age} años</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )
                            )}
                        </article>
                    );
                })}
            </section>
        </div>
    );
};

export default TeacherSchedule;
