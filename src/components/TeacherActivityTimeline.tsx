import React from 'react';
import type { TeacherActivityEntry } from '../services/domain/teacherActivityService';
import { ACTIVITY_META, groupActivityByDay, dayHeading, timeOfDay } from '../utils/teacherActivityView';

interface TeacherActivityTimelineProps {
    entries: TeacherActivityEntry[];
    now?: Date;
}

// Línea de tiempo del registro: un bloque por día (el más reciente primero) con una fila por acción.
const TeacherActivityTimeline: React.FC<TeacherActivityTimelineProps> = ({ entries, now }) => (
    <div className="space-y-6">
        {groupActivityByDay(entries).map(group => (
            <section key={group.day} aria-label={dayHeading(group.day, now)}>
                <h3 className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm py-2 text-sm font-semibold text-gray-300">{dayHeading(group.day, now)}</h3>
                <ul className="space-y-2">
                    {group.entries.map(e => {
                        const meta = ACTIVITY_META[e.type] || { label: e.type, icon: '•', tone: 'bg-gray-500/15 text-gray-300 border-gray-500/30' };
                        return (
                            <li key={e.id} className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3">
                                <span className="font-mono text-xs text-gray-400 w-11 flex-shrink-0 pt-1">{timeOfDay(e.createdAt)}</span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="font-semibold text-white">{e.instructorName || 'Profesor'}</span>
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold border rounded-full px-2 py-0.5 ${meta.tone}`}>
                                            <span aria-hidden="true">{meta.icon}</span>{meta.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mt-1 break-words">{e.description}</p>
                                    {e.actorEmail && <p className="text-xs text-gray-500 mt-0.5 break-all">Por {e.actorEmail}</p>}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>
        ))}
    </div>
);

export default TeacherActivityTimeline;
