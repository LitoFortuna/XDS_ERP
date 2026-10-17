import React, { useMemo } from 'react';
import { DanceClass } from '../../../types';
import { downloadWeeklyClassesIcs } from '../../utils/icsExport';

const WEEK_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface WeeklyScheduleProps {
    /** Solo las clases en las que está inscrita la alumna. */
    classes: DanceClass[];
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ classes }) => {
    const today = useMemo(() => {
        const name = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
        return name.charAt(0).toUpperCase() + name.slice(1);
    }, []);

    const byDay = useMemo(() => WEEK_ORDER
        .map(day => ({
            day,
            items: classes
                .filter(c => c.days.includes(day as DanceClass['days'][number]))
                .sort((a, b) => a.startTime.localeCompare(b.startTime)),
        }))
        .filter(group => group.items.length > 0), [classes]);

    return (
        <section className="bg-gray-800 rounded-xl border border-gray-700 p-6" aria-labelledby="weekly-schedule-title">
            <div className="flex items-start justify-between gap-3 mb-4">
                <h3 id="weekly-schedule-title" className="text-lg font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Mi semana
                </h3>
            </div>

            {byDay.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Todavía no estás inscrita en ninguna clase.</p>
            ) : (
                <>
                    <ul className="space-y-3">
                        {byDay.map(({ day, items }) => (
                            <li key={day} className={`rounded-lg border p-3 ${day === today ? 'border-purple-400/60 bg-purple-500/10' : 'border-gray-700/60 bg-gray-900/40'}`}>
                                <p className={`text-xs font-black uppercase tracking-widest mb-2 ${day === today ? 'text-purple-300' : 'text-gray-400'}`}>
                                    {day}{day === today && ' · hoy'}
                                </p>
                                <ul className="space-y-2">
                                    {items.map(c => (
                                        <li key={c.id} className="flex items-baseline gap-3">
                                            <span className="font-mono text-sm text-purple-200 flex-shrink-0 w-[5.5rem]">{c.startTime}–{c.endTime}</span>
                                            <span className="min-w-0">
                                                <span className="block text-white font-semibold text-sm break-words">{c.name}</span>
                                                {c.instructorName && <span className="block text-xs text-gray-400">{c.instructorName}</span>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => downloadWeeklyClassesIcs(classes.map(c => ({
                            id: c.id, name: c.name, days: c.days, startTime: c.startTime, endTime: c.endTime, instructorName: c.instructorName,
                        })))}
                        className="mt-4 w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/40 text-purple-100 font-semibold text-sm touch-manipulation"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Añadir mi horario a mi calendario
                    </button>
                    <p className="text-[11px] text-gray-500 mt-2 text-center">Se repite cada semana en Google Calendar, Apple Calendar u Outlook, con aviso 1 hora antes.</p>
                </>
            )}
        </section>
    );
};

export default WeeklySchedule;
