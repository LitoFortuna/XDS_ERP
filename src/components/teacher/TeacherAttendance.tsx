import React, { useEffect, useMemo, useState } from 'react';
import { TeacherOverview, saveTeacherAttendance } from '../../services/domain/teacherService';
import { classesOnDate } from '../../utils/teacherStats';
import { useToast } from '../ui/Feedback';

interface TeacherAttendanceProps {
    data: TeacherOverview;
    initialClassId?: string;
    onSaved: () => void;
    isRefreshing?: boolean;
}

const addDays = (iso: string, days: number): string =>
    new Date(Date.parse(iso + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);

// El servidor solo admite hoy y hasta 60 días atrás (functions/src/teacherData.ts).
const MAX_BACKDATE_DAYS = 60;

const TeacherAttendance: React.FC<TeacherAttendanceProps> = ({ data, initialClassId, onSaved, isRefreshing }) => {
    const toast = useToast();
    const { today, classes, students, attendance, absences } = data;

    const [classId, setClassId] = useState(() =>
        initialClassId && classes.some(c => c.id === initialClassId)
            ? initialClassId
            : (classesOnDate(classes, today)[0] || classes[0])?.id || ''
    );
    const [date, setDate] = useState(today);
    const [present, setPresent] = useState<Set<string>>(new Set());
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const enrolled = useMemo(
        () => students.filter(s => s.enrolledClassIds.includes(classId)).sort((a, b) => a.name.localeCompare(b.name, 'es')),
        [students, classId]
    );
    const existing = useMemo(
        () => attendance.find(r => r.classId === classId && r.date === date),
        [attendance, classId, date]
    );
    const absentToday = useMemo(
        () => new Set(absences.filter(a => a.classId === classId && a.date === date).map(a => a.studentId)),
        [absences, classId, date]
    );
    const selectedClass = classes.find(c => c.id === classId);
    const scheduledThatDay = classesOnDate(classes, date).some(c => c.id === classId);

    // Al cambiar de clase o de día se carga lo ya guardado (si había lista) o se parte de cero.
    useEffect(() => {
        setPresent(new Set(existing?.presentStudentIds.filter(id => enrolled.some(s => s.id === id)) || []));
        setNotes(existing?.myNotes ?? existing?.notes ?? '');
        // existing cambia de referencia al refrescar tras guardar; eso reconstruye el mismo estado.
    }, [existing, enrolled]);

    const toggle = (id: string) => setPresent(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const handleSave = async () => {
        if (!classId || isSaving) return;
        setIsSaving(true);
        try {
            await saveTeacherAttendance({ classId, date, presentStudentIds: [...present], notes });
            toast(`Lista guardada: ${present.size} de ${enrolled.length} presentes.`, 'success');
            onSaved();
        } catch (error) {
            const message = (error as { message?: string } | null)?.message;
            toast(message ? `No se pudo guardar la lista. ${message}` : 'No se pudo guardar la lista. Inténtalo de nuevo.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (classes.length === 0) {
        return (
            <div className="max-w-xl mx-auto text-center bg-gray-800 border border-gray-700 rounded-xl p-8">
                <p className="text-gray-400">Todavía no tienes clases asignadas, así que no hay listas que pasar.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-5 pb-28">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Asistencia</h2>
                <p className="text-gray-400 text-sm">Pasa lista de tus clases.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div>
                    <label htmlFor="teacher-att-class" className="block text-xs font-medium text-gray-400 mb-1">Clase</label>
                    <select
                        id="teacher-att-class"
                        value={classId}
                        onChange={e => setClassId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.groupName ? ` · ${c.groupName}` : ''} ({c.days.join(', ')} {c.startTime})</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="teacher-att-date" className="block text-xs font-medium text-gray-400 mb-1">Día</label>
                    <input
                        id="teacher-att-date"
                        type="date"
                        value={date}
                        min={addDays(today, -MAX_BACKDATE_DAYS)}
                        max={today}
                        onChange={e => e.target.value && setDate(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            {selectedClass && !scheduledThatDay && (
                <p role="status" className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5">
                    {selectedClass.name} no es una clase habitual de ese día ({selectedClass.days.join(', ')}). Puedes pasar lista igualmente.
                </p>
            )}
            {selectedClass?.groupName && (
                <p role="status" className="text-sm text-purple-200 bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-2.5">
                    Esta clase tiene varios grupos: aquí pasas lista de <strong>{selectedClass.groupName}</strong>. Los demás grupos los pasan sus profesores.
                </p>
            )}
            {existing && (
                <p role="status" className="text-sm text-sky-200 bg-sky-500/10 border border-sky-500/30 rounded-lg px-4 py-2.5">
                    Ya hay una lista guardada para este día. Si la cambias, se actualizará.
                </p>
            )}

            <section className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden" aria-label="Alumnas de la clase">
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-semibold text-white">
                        {present.size} de {enrolled.length} presentes
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => setPresent(new Set(enrolled.map(s => s.id)))} className="text-xs font-bold text-purple-200 bg-purple-500/15 border border-purple-400/30 rounded-lg px-3 py-2.5 sm:py-1.5">Marcar todas</button>
                        <button onClick={() => setPresent(new Set())} className="text-xs font-bold text-gray-300 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 sm:py-1.5">Ninguna</button>
                    </div>
                </div>

                {enrolled.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No hay alumnas activas inscritas en esta clase.</p>
                ) : (
                    <ul>
                        {enrolled.map(s => {
                            const isPresent = present.has(s.id);
                            return (
                                <li key={s.id} className="border-b border-gray-700/60 last:border-b-0">
                                    <button
                                        onClick={() => toggle(s.id)}
                                        aria-pressed={isPresent}
                                        className={`w-full min-h-[56px] flex items-center gap-4 px-4 py-2 text-left touch-manipulation transition-colors ${isPresent ? 'bg-green-500/10' : 'hover:bg-gray-700/40'}`}
                                    >
                                        <span aria-hidden="true" className={`w-8 h-8 flex-shrink-0 rounded-full border-2 flex items-center justify-center text-sm font-bold ${isPresent ? 'bg-green-500 border-green-500 text-white' : 'border-gray-500 text-transparent'}`}>✓</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-semibold text-white truncate">{s.name}</span>
                                            {absentToday.has(s.id) && <span className="block text-xs text-amber-300">Avisó que no viene</span>}
                                        </span>
                                        <span className={`text-xs font-bold flex-shrink-0 ${isPresent ? 'text-green-300' : 'text-gray-500'}`}>{isPresent ? 'Presente' : 'Falta'}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <div>
                <label htmlFor="teacher-att-notes" className="block text-xs font-medium text-gray-400 mb-1">Notas de la clase (opcional)</label>
                <textarea
                    id="teacher-att-notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Coreografía trabajada, incidencias…"
                />
            </div>

            <div className="fixed md:static bottom-[calc(4.25rem+env(safe-area-inset-bottom))] inset-x-0 z-20 px-4 md:px-0">
                <button
                    onClick={handleSave}
                    disabled={isSaving || isRefreshing || enrolled.length === 0}
                    className="w-full max-w-3xl mx-auto block min-h-[52px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl"
                >
                    {isSaving ? 'Guardando…' : existing ? 'Actualizar lista' : 'Guardar lista'}
                </button>
            </div>
        </div>
    );
};

export default TeacherAttendance;
