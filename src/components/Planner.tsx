import React, { useMemo, useRef, useState } from 'react';
import { PlannerTask, PlannerTaskCategory, PlannerTaskPriority, DanceEvent, View } from '../../types';
import { useAppStore } from '../store/useAppStore';
import { usePlannerTasks } from '../hooks/queries/usePlannerTasks';
import Modal from './Modal';
import { toIsoLocal, compareTasks, PRIORITY_DOT } from '../utils/plannerUtils';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const CATEGORIES: PlannerTaskCategory[] = ['Administrativo', 'Clases', 'Eventos', 'Marketing', 'Otro'];
const PRIORITY_LABEL: Record<PlannerTaskPriority, string> = { high: 'Alta', medium: 'Media', low: 'Baja' };
const PRIORITY_CHIP: Record<PlannerTaskPriority, string> = {
    high: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    low: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
};

// Solo la primera letra en mayúscula ("Miércoles, 14 de octubre"); la clase CSS `capitalize` habría
// puesto en mayúscula cada palabra ("14 De Octubre").
const formatLongDate = (iso: string) => {
    const text = new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    return text.charAt(0).toUpperCase() + text.slice(1);
};

interface TaskDraft {
    id?: string;
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: PlannerTaskPriority;
    category: PlannerTaskCategory;
}

const emptyDraft = (dueDate: string): TaskDraft => ({
    title: '',
    description: '',
    dueDate,
    dueTime: '',
    priority: 'medium',
    category: 'Administrativo',
});

const inputClass = 'w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent';

const Planner: React.FC = () => {
    const { tasks, isLoading, error, addTask, updateTask, deleteTask } = usePlannerTasks();
    const events = useAppStore(state => state.events);
    const setCurrentView = useAppStore(state => state.setCurrentView);

    const todayIso = toIsoLocal(new Date());
    const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
    const [selectedDate, setSelectedDate] = useState(todayIso);
    const [showCompleted, setShowCompleted] = useState(true);
    const [showEvents, setShowEvents] = useState(true);
    const [draft, setDraft] = useState<TaskDraft | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    const visibleTasks = useMemo(() => (showCompleted ? tasks : tasks.filter(t => !t.completed)), [tasks, showCompleted]);

    const tasksByDate = useMemo(() => {
        const map = new Map<string, PlannerTask[]>();
        visibleTasks.forEach(t => {
            if (!t.dueDate) return;
            const list = map.get(t.dueDate);
            if (list) list.push(t); else map.set(t.dueDate, [t]);
        });
        map.forEach(list => list.sort(compareTasks));
        return map;
    }, [visibleTasks]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, DanceEvent[]>();
        events.forEach(ev => {
            if (!ev.date || ev.deletedAt) return;
            const list = map.get(ev.date);
            if (list) list.push(ev); else map.set(ev.date, [ev]);
        });
        map.forEach(list => list.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')));
        return map;
    }, [events]);

    const monthEventCount = useMemo(() => {
        const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`;
        let count = 0;
        eventsByDate.forEach((list, date) => { if (date.startsWith(prefix)) count += list.length; });
        return count;
    }, [eventsByDate, viewYear, viewMonth]);

    const overdueTasks = useMemo(
        () => tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayIso).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!)),
        [tasks, todayIso]
    );
    const undatedTasks = useMemo(
        () => visibleTasks.filter(t => !t.dueDate).sort(compareTasks),
        [visibleTasks]
    );
    const pendingCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);

    // Cuadrícula del mes: semanas de lunes a domingo, con huecos de los meses vecinos.
    const calendarCells = useMemo(() => {
        const first = new Date(viewYear, viewMonth, 1);
        const offset = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const cells: (string | null)[] = Array(offset).fill(null);
        for (let day = 1; day <= daysInMonth; day++) cells.push(toIsoLocal(new Date(viewYear, viewMonth, day)));
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [viewYear, viewMonth]);

    const goToMonth = (delta: number) => {
        const d = new Date(viewYear, viewMonth + delta, 1);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
    };

    // Deslizar horizontalmente sobre la cuadrícula cambia de mes. Solo cuenta si el gesto es
    // claramente horizontal, para no robarle el gesto al scroll vertical de la página.
    const handleGridTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
    };
    const handleGridTouchEnd = (e: React.TouchEvent) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) goToMonth(dx < 0 ? 1 : -1);
    };

    const goToToday = () => {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
        setSelectedDate(toIsoLocal(now));
    };

    const openNew = (dueDate: string) => {
        setSaveError('');
        setDraft(emptyDraft(dueDate));
    };

    const openEdit = (task: PlannerTask) => {
        setSaveError('');
        setDraft({
            id: task.id,
            title: task.title,
            description: task.description || '',
            dueDate: task.dueDate || '',
            dueTime: task.dueTime || '',
            priority: task.priority,
            category: task.category,
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!draft || !draft.title.trim()) return;
        setIsSaving(true);
        setSaveError('');
        try {
            const base = {
                title: draft.title.trim(),
                description: draft.description.trim() || undefined,
                dueDate: draft.dueDate || undefined,
                // Una hora sin fecha no significa nada, así que se descarta.
                dueTime: draft.dueDate && draft.dueTime ? draft.dueTime : undefined,
                priority: draft.priority,
                category: draft.category,
            };
            if (draft.id) {
                const existing = tasks.find(t => t.id === draft.id);
                if (!existing) throw new Error('La tarea ya no existe.');
                await updateTask({ ...existing, ...base });
            } else {
                await addTask({ ...base, completed: false, createdAt: new Date().toISOString() });
            }
            if (draft.dueDate) {
                setSelectedDate(draft.dueDate);
                const d = new Date(draft.dueDate + 'T12:00:00');
                setViewYear(d.getFullYear());
                setViewMonth(d.getMonth());
            }
            setDraft(null);
        } catch (err: any) {
            setSaveError(err?.message || 'No se pudo guardar la tarea.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async (task: PlannerTask) => {
        try {
            await updateTask({
                ...task,
                completed: !task.completed,
                completedAt: task.completed ? undefined : new Date().toISOString(),
            });
        } catch (err: any) {
            alert(err?.message || 'No se pudo actualizar la tarea.');
        }
    };

    const handleDelete = async (task: PlannerTask) => {
        if (!window.confirm(`¿Eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`)) return;
        try {
            await deleteTask(task.id);
        } catch (err: any) {
            alert(err?.message || 'No se pudo eliminar la tarea.');
        }
    };

    const renderTaskRow = (task: PlannerTask, showDate = false) => (
        <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border bg-gray-800/60 ${task.completed ? 'border-gray-700/50 opacity-60' : 'border-gray-700'}`}>
            <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task)}
                aria-label={`Marcar "${task.title}" como ${task.completed ? 'pendiente' : 'hecha'}`}
                className="mt-0.5 sm:mt-1 h-6 w-6 sm:h-4 sm:w-4 flex-shrink-0 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold text-white break-words ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                {task.description && <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-line break-words">{task.description}</p>}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${PRIORITY_CHIP[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-700/60 px-1.5 py-0.5 rounded">{task.category}</span>
                    {showDate && task.dueDate && (
                        <span className="text-[10px] font-semibold text-gray-400">{new Date(task.dueDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    )}
                    {task.dueTime && <span className="text-[10px] font-semibold text-gray-400">{task.dueTime}</span>}
                </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(task)} title="Editar" aria-label={`Editar "${task.title}"`} className="p-3 sm:p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-.879.513L7 17l.659-3.949a2 2 0 01.513-.879z" /></svg>
                </button>
                <button onClick={() => handleDelete(task)} title="Eliminar" aria-label={`Eliminar "${task.title}"`} className="p-3 sm:p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded">
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>
    );

    const selectedTasks = tasksByDate.get(selectedDate) || [];
    const selectedEvents = showEvents ? (eventsByDate.get(selectedDate) || []) : [];

    return (
        <div className="p-3 pb-24 sm:p-8 sm:pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Calendario y Tareas</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {pendingCount} {pendingCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}
                        {overdueTasks.length > 0 && <span className="text-rose-400 font-semibold"> · {overdueTasks.length} atrasada{overdueTasks.length > 1 ? 's' : ''}</span>}
                        <span className="text-purple-300"> · {monthEventCount} {monthEventCount === 1 ? 'evento' : 'eventos'} en {MONTH_NAMES[viewMonth].toLowerCase()}</span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <label className="flex items-center whitespace-nowrap text-xs text-gray-400 cursor-pointer hover:text-gray-200 py-1.5 sm:py-0">
                        <input
                            type="checkbox"
                            checked={showCompleted}
                            onChange={e => setShowCompleted(e.target.checked)}
                            className="mr-2 h-5 w-5 sm:h-4 sm:w-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                        />
                        Mostrar hechas
                    </label>
                    <label className="flex items-center whitespace-nowrap text-xs text-gray-400 cursor-pointer hover:text-gray-200 py-1.5 sm:py-0">
                        <input
                            type="checkbox"
                            checked={showEvents}
                            onChange={e => setShowEvents(e.target.checked)}
                            className="mr-2 h-5 w-5 sm:h-4 sm:w-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                        />
                        Mostrar eventos
                    </label>
                    <button
                        onClick={() => openNew(selectedDate)}
                        className="hidden sm:block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg text-sm"
                    >
                        + Nueva tarea
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-sm text-red-300">
                    No se pudieron cargar las tareas. Si el problema continúa, comprueba que las reglas de Firestore incluyen la colección "calendarTasks".
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-2 sm:p-4">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <button onClick={() => goToMonth(-1)} aria-label="Mes anterior" className="p-2.5 sm:p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => goToMonth(1)} aria-label="Mes siguiente" className="p-2.5 sm:p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <h3 className="text-lg sm:text-xl font-bold text-white ml-1 sm:ml-2">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
                        </div>
                        <button onClick={goToToday} className="px-3 py-2 sm:py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200">Hoy</button>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
                        {WEEKDAY_LABELS.map(label => (
                            <div key={label} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-500 py-1">{label}</div>
                        ))}
                    </div>

                    <div
                        className="grid grid-cols-7 gap-0.5 sm:gap-1"
                        onTouchStart={handleGridTouchStart}
                        onTouchEnd={handleGridTouchEnd}
                    >
                        {calendarCells.map((iso, idx) => {
                            if (!iso) return <div key={`empty-${idx}`} className="min-h-[56px] sm:min-h-[84px] rounded-lg bg-gray-900/30" />;
                            const dayTasks = tasksByDate.get(iso) || [];
                            const dayEvents = showEvents ? (eventsByDate.get(iso) || []) : [];
                            const cellItems = [
                                ...dayEvents.map(ev => ({ kind: 'event' as const, ev })),
                                ...dayTasks.map(t => ({ kind: 'task' as const, t })),
                            ];
                            const shownItems = cellItems.slice(0, 3);
                            const extraItems = cellItems.length - shownItems.length;
                            const dotItems = cellItems.slice(0, 4);
                            const extraDots = cellItems.length - dotItems.length;
                            const isToday = iso === todayIso;
                            const isSelected = iso === selectedDate;
                            const hasOverdue = iso < todayIso && dayTasks.some(t => !t.completed);
                            const summary = [
                                dayEvents.length > 0 ? `${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}` : '',
                                dayTasks.length > 0 ? `${dayTasks.length} ${dayTasks.length === 1 ? 'tarea' : 'tareas'}` : '',
                            ].filter(Boolean).join(', ');
                            return (
                                <button
                                    key={iso}
                                    onClick={() => setSelectedDate(iso)}
                                    onDoubleClick={() => openNew(iso)}
                                    title="Doble clic para añadir una tarea en este día"
                                    aria-label={`${formatLongDate(iso)}${summary ? `: ${summary}` : ''}`}
                                    aria-pressed={isSelected}
                                    className={`min-h-[56px] sm:min-h-[84px] min-w-0 items-center sm:items-stretch text-left p-1 sm:p-1.5 rounded-lg border transition-colors flex flex-col gap-0.5 sm:gap-1 ${isSelected ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-900/40 hover:bg-gray-700/40'}`}
                                >
                                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-purple-600 text-white' : hasOverdue ? 'text-rose-400' : 'text-gray-300'}`}>
                                        {Number(iso.slice(8, 10))}
                                    </span>
                                    {/* Móvil: la casilla es demasiado estrecha para leer títulos, así que solo puntos
                                        (rombo morado = evento, círculo de color = tarea según su prioridad). El
                                        detalle del día aparece justo debajo al tocarlo. */}
                                    {cellItems.length > 0 && (
                                        <div className="sm:hidden flex flex-wrap justify-center items-center gap-0.5 max-w-full">
                                            {dotItems.map(item => item.kind === 'event' ? (
                                                <span key={`ev-${item.ev.id}`} className="w-1.5 h-1.5 mx-0.5 rotate-45 bg-purple-400" />
                                            ) : (
                                                <span key={item.t.id} className={`w-2 h-2 rounded-full ${PRIORITY_DOT[item.t.priority]} ${item.t.completed ? 'opacity-30' : ''}`} />
                                            ))}
                                            {extraDots > 0 && <span className="text-[9px] leading-none font-bold text-gray-400">+{extraDots}</span>}
                                        </div>
                                    )}
                                    <div className="hidden sm:flex flex-col gap-0.5 min-w-0">
                                        {shownItems.map(item => item.kind === 'event' ? (
                                            <span key={`ev-${item.ev.id}`} className="text-[10px] leading-tight truncate font-semibold text-purple-200 bg-purple-500/20 rounded px-1 py-0.5">
                                                ★ {item.ev.time ? `${item.ev.time} ` : ''}{item.ev.name}
                                            </span>
                                        ) : (
                                            <span key={item.t.id} className={`flex items-center gap-1 text-[10px] leading-tight truncate ${item.t.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[item.t.priority]}`} />
                                                <span className="truncate">{item.t.title}</span>
                                            </span>
                                        ))}
                                        {extraItems > 0 && <span className="text-[10px] text-gray-500 font-semibold">+{extraItems} más</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="hidden sm:block text-[11px] text-gray-500 mt-3">Clic en un día para ver sus tareas y eventos · doble clic para añadir una tarea en ese día · ★ = evento (se gestionan en Eventos).</p>
                    <div className="sm:hidden flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500 mt-3">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 mx-0.5 rotate-45 bg-purple-400" />Evento</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />Tarea (color = prioridad)</span>
                        <span>Desliza para cambiar de mes</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-bold text-white">{formatLongDate(selectedDate)}</h3>
                            <button onClick={() => openNew(selectedDate)} className="text-xs font-bold text-purple-300 hover:text-purple-200 px-2 py-2 -mr-2 sm:p-0 sm:mr-0">+ Añadir</button>
                        </div>
                        {isLoading ? (
                            <p className="text-sm text-gray-500">Cargando tareas...</p>
                        ) : (
                            <div className="space-y-2">
                                {selectedEvents.map(ev => {
                                    const enrolled = ev.participants?.length || ev.studentIds?.length || 0;
                                    return (
                                        <button
                                            key={`ev-${ev.id}`}
                                            onClick={() => setCurrentView(View.EVENTS)}
                                            title="Abrir la pantalla de Eventos"
                                            className="w-full text-left p-3 rounded-lg border border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm font-semibold text-purple-100 break-words">★ {ev.name}</span>
                                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-purple-500/20 text-purple-300 border-purple-500/30 flex-shrink-0">{ev.type}</span>
                                            </div>
                                            {(ev.time || ev.location) && (
                                                <p className="text-xs text-purple-300/80 mt-1 break-words">{[ev.time, ev.location].filter(Boolean).join(' · ')}</p>
                                            )}
                                            <p className="text-[11px] text-purple-300/60 mt-1">
                                                {enrolled} inscrita{enrolled === 1 ? '' : 's'}{ev.capacity ? ` de ${ev.capacity}` : ''} · Ver en Eventos →
                                            </p>
                                        </button>
                                    );
                                })}
                                {selectedTasks.map(t => renderTaskRow(t))}
                                {selectedTasks.length === 0 && selectedEvents.length === 0 && (
                                    <p className="text-sm text-gray-500">Nada planificado para este día.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {overdueTasks.length > 0 && (
                        <div className="bg-rose-950/20 rounded-xl border border-rose-500/30 shadow-lg p-4">
                            <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider mb-3">Atrasadas ({overdueTasks.length})</h3>
                            <div className="space-y-2">{overdueTasks.map(t => renderTaskRow(t, true))}</div>
                        </div>
                    )}

                    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-4">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Sin fecha ({undatedTasks.length})</h3>
                        {undatedTasks.length > 0 ? (
                            <div className="space-y-2">{undatedTasks.map(t => renderTaskRow(t))}</div>
                        ) : (
                            <p className="text-sm text-gray-500">Las tareas sin fecha aparecerán aquí hasta que las planifiques.</p>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={() => openNew(selectedDate)}
                aria-label="Nueva tarea"
                className="sm:hidden fixed bottom-5 right-4 z-20 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-900/50 flex items-center justify-center active:scale-95 transition-transform"
            >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            </button>

            <Modal isOpen={draft !== null} onClose={() => setDraft(null)} title={draft?.id ? 'Editar tarea' : 'Nueva tarea'}>
                {draft && (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Título</label>
                            <input
                                type="text"
                                value={draft.title}
                                onChange={e => setDraft({ ...draft, title: e.target.value })}
                                placeholder="Ej: Preparar la coreografía de fin de curso"
                                className={inputClass}
                                autoFocus
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Descripción (opcional)</label>
                            <textarea
                                value={draft.description}
                                onChange={e => setDraft({ ...draft, description: e.target.value })}
                                rows={3}
                                className={inputClass}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Fecha</label>
                                <input
                                    type="date"
                                    value={draft.dueDate}
                                    onChange={e => setDraft({ ...draft, dueDate: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Hora (opcional)</label>
                                <input
                                    type="time"
                                    value={draft.dueTime}
                                    onChange={e => setDraft({ ...draft, dueTime: e.target.value })}
                                    disabled={!draft.dueDate}
                                    className={`${inputClass} disabled:opacity-40`}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 -mt-2">Sin fecha, la tarea queda en "Sin fecha" hasta que la planifiques.</p>
                        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Prioridad</label>
                                <select
                                    value={draft.priority}
                                    onChange={e => setDraft({ ...draft, priority: e.target.value as PlannerTaskPriority })}
                                    className={inputClass}
                                >
                                    <option value="high">Alta</option>
                                    <option value="medium">Media</option>
                                    <option value="low">Baja</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                                <select
                                    value={draft.category}
                                    onChange={e => setDraft({ ...draft, category: e.target.value as PlannerTaskCategory })}
                                    className={inputClass}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        {saveError && <p className="text-sm text-red-400">{saveError}</p>}
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setDraft(null)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold">Cancelar</button>
                            <button
                                type="submit"
                                disabled={isSaving || !draft.title.trim()}
                                className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold"
                            >
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Planner;
