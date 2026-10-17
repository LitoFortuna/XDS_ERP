import React from 'react';
import { TeacherEvent } from '../../services/domain/teacherService';

const daysUntil = (todayIso: string, dateIso: string): number =>
    Math.round((Date.parse(dateIso + 'T00:00:00Z') - Date.parse(todayIso + 'T00:00:00Z')) / 86400000);

const relativeLabel = (days: number): string => {
    if (days === 0) return '¡Hoy!';
    if (days === 1) return 'Mañana';
    if (days < 7) return `En ${days} días`;
    const weeks = Math.round(days / 7);
    return days < 30 ? `En ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}` : `En ${Math.round(days / 30)} ${Math.round(days / 30) === 1 ? 'mes' : 'meses'}`;
};

const TYPE_STYLE: Record<string, string> = {
    'Competición': 'text-amber-200 bg-amber-500/15 border-amber-500/30',
    'Exhibición': 'text-pink-200 bg-pink-500/15 border-pink-500/30',
    'Taller': 'text-sky-200 bg-sky-500/15 border-sky-500/30',
};

interface TeacherEventCardProps {
    event: TeacherEvent;
    today: string;
    /** Con true se listan los nombres de sus alumnas apuntadas (vista completa). */
    showStudents?: boolean;
}

// Evento próximo del ERP, con cuántas inscritas hay y cuáles son alumnas de este profesor.
const TeacherEventCard: React.FC<TeacherEventCardProps> = ({ event, today, showStudents = false }) => {
    const days = daysUntil(today, event.date);
    const dateLabel = new Date(event.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const mine = event.myStudents.length;

    return (
        <article className="bg-gray-900/50 border border-gray-700/70 rounded-lg p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <span className={`inline-block text-[10px] font-black uppercase tracking-widest border rounded-full px-2 py-0.5 mb-1.5 ${TYPE_STYLE[event.type] || 'text-purple-200 bg-purple-500/15 border-purple-500/30'}`}>
                        {event.type || 'Evento'}
                    </span>
                    <h3 className="font-semibold text-white break-words">{event.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 first-letter:uppercase">
                        {dateLabel}{event.time && ` · ${event.time}`}
                    </p>
                    {event.location && <p className="text-xs text-gray-400 break-words">📍 {event.location}</p>}
                </div>
                <span className={`flex-shrink-0 text-xs font-bold rounded-full px-2.5 py-1 ${days <= 1 ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                    {relativeLabel(days)}
                </span>
            </div>

            <p className="text-xs text-gray-300 mt-3">
                {event.enrolledCount} {event.enrolledCount === 1 ? 'inscrita' : 'inscritas'}{event.capacity ? ` de ${event.capacity}` : ''}
                {' · '}
                <span className={mine > 0 ? 'text-purple-200 font-semibold' : 'text-gray-400'}>
                    {mine === 0 ? 'ninguna de tus alumnas' : `${mine} ${mine === 1 ? 'alumna tuya' : 'alumnas tuyas'}`}
                </span>
            </p>
            {showStudents && mine > 0 && (
                <p className="text-xs text-gray-400 mt-1 break-words">{event.myStudents.join(', ')}</p>
            )}
        </article>
    );
};

export default TeacherEventCard;
