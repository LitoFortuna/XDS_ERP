import React, { useMemo, useRef, useState } from 'react';
import { PlannerTask, DanceEvent, View } from '../../types';
import { useAppStore } from '../store/useAppStore';
import { usePlannerTasks } from '../hooks/queries/usePlannerTasks';
import TaskSheet, { TaskDraft, emptyDraft } from './planner/TaskSheet';
import {
    toIsoLocal, addDaysIso, compareTasks, dayLoadTint,
    PRIORITY_DOT, PRIORITY_BAR, PRIORITY_BORDER, PRIORITY_TEXT, PRIORITY_LABEL,
} from '../utils/plannerUtils';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Solo la primera letra en mayúscula ("Miércoles, 14 de octubre"); la clase CSS `capitalize` habría
// puesto en mayúscula cada palabra ("14 De Octubre").
const formatLongDate = (iso: string) => {
    const text = new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    return text.charAt(0).toUpperCase() + text.slice(1);
};

const toggleBase = "block whitespace-nowrap text-xs font-semibold px-3 py-2.5 sm:py-1.5 rounded-full border border-gray-600 text-gray-400 hover:text-gray-200 touch-manipulation peer-checked:bg-purple-500/20 peer-checked:border-purple-400/60 peer-checked:text-purple-200 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-400 peer-checked:before:content-['✓'] before:mr-1.5";

type MobileView = 'month' | 'agenda';

const Planner: React.FC = () => {
    const { tasks, isLoading, error, addTask, updateTask, deleteTask } = usePlannerTasks();
    const events = useAppStore(state => state.events);
    const setCurrentView = useAppStore(state => state.setCurrentView);

    const todayIso = toIsoLocal(new Date());
    const tomorrowIso = addDaysIso(new Date(), 1);
    const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
    const [selectedDate, setSelectedDate] = useState(todayIso);
    const [mobileView, setMobileView] = useState<MobileView>('month');
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

    // Días de hoy en adelante con algo planificado (más hoy, aunque esté vacío), para la Agenda.
    const agendaDays = useMemo(() => {
        const dates = new Set<string>([todayIso]);
        visibleTasks.forEach(t => { if (t.dueDate && t.dueDate >= todayIso) dates.add(t.dueDate); });
        if (showEvents) eventsByDate.forEach((_, date) => { if (date >= todayIso) dates.add(date); });
        return [...dates].sort();
    }, [visibleTasks, eventsByDate, showEvents, todayIso]);

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

    const handleDelete = async (task: PlannerTask): Promise<boolean> => {
        if (!window.confirm(`¿Eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`)) return false;
        try {
            await deleteTask(task.id);
            return true;
        } catch (err: any) {
            alert(err?.message || 'No se pudo eliminar la tarea.');
            return false;
        }
    };

    // La prioridad se lee por la barra de color del borde izquierdo y por la palabra en la línea
    // de detalle (el color solo no basta). En móvil toda la fila se toca para editar y los
    // iconos se ocultan: así el título gana casi la mitad del ancho; la casilla tiene un área
    // de toque mayor que su dibujo.
    const renderTaskRow = (task: PlannerTask, showDate = false) => {
        const meta: React.ReactNode[] = [
            <span key="p" className={`font-semibold ${PRIORITY_TEXT[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>,
            <span key="c">{task.category}</span>,
        ];
        if (showDate && task.dueDate) {
            meta.push(<span key="d">{new Date(task.dueDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>);
        }
        if (task.dueTime) meta.push(<span key="t">{task.dueTime}</span>);

        return (
            <div key={task.id} className={`relative flex items-start gap-2 sm:gap-3 pl-4 pr-2 py-3 rounded-lg border border-gray-700/60 bg-gray-900/50 overflow-hidden transition-opacity ${task.completed ? 'opacity-55' : ''}`}>
                <span aria-hidden="true" className={`absolute left-0 inset-y-0 w-1 ${PRIORITY_BAR[task.priority]}`} />
                <label className="-m-2 p-2 sm:m-0 sm:p-0 flex-shrink-0 cursor-pointer touch-manipulation">
                    <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggle(task)}
                        aria-label={`Marcar "${task.title}" como ${task.completed ? 'pendiente' : 'hecha'}`}
                        className="block mt-0 sm:mt-1 h-6 w-6 sm:h-4 sm:w-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                </label>
                <div className="flex-1 min-w-0 cursor-pointer touch-manipulation" onClick={() => openEdit(task)}>
                    <p className={`text-sm font-semibold break-words ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>{task.title}</p>
                    {task.description && <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-line break-words">{task.description}</p>}
                    <p className="flex flex-wrap items-center gap-x-1.5 mt-1 text-xs sm:text-[11px] text-gray-500">
                        {meta.map((node, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <span aria-hidden="true">·</span>}
                                {node}
                            </React.Fragment>
                        ))}
                    </p>
                </div>
                <div className="hidden sm:flex gap-0.5 flex-shrink-0">
                    <button onClick={() => openEdit(task)} title="Editar" aria-label={`Editar "${task.title}"`} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700/70 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-.879.513L7 17l.659-3.949a2 2 0 01.513-.879z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(task)} title="Eliminar" aria-label={`Eliminar "${task.title}"`} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700/70 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
        );
    };

    const renderEventCard = (ev: DanceEvent) => {
        const enrolled = ev.participants?.length || ev.studentIds?.length || 0;
        return (
            <button
                key={`ev-${ev.id}`}
                onClick={() => setCurrentView(View.EVENTS)}
                title="Abrir la pantalla de Eventos"
                className="relative block w-full text-left pl-4 pr-3 py-3 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors overflow-hidden touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
                <span aria-hidden="true" className="absolute left-0 inset-y-0 w-1 bg-purple-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Evento · {ev.type}</p>
                <p className="text-sm font-semibold text-purple-50 break-words mt-0.5">{ev.name}</p>
                {(ev.time || ev.location) && (
                    <p className="text-xs text-purple-200/80 mt-1 break-words">{[ev.time, ev.location].filter(Boolean).join(' · ')}</p>
                )}
                <p className="text-xs sm:text-[11px] text-purple-300/70 mt-1">
                    {enrolled} inscrita{enrolled === 1 ? '' : 's'}{ev.capacity ? ` de ${ev.capacity}` : ''} · Ver en Eventos →
                </p>
            </button>
        );
    };

    // Vista Agenda (solo móvil): lo atrasado, luego cada día desde hoy con sus eventos y tareas,
    // y al final lo que no tiene fecha. Los títulos de día se quedan pegados arriba al hacer scroll.
    const renderAgenda = () => {
        if (isLoading) return <p className="text-sm text-gray-500">Cargando tareas...</p>;
        const nothingPlanned = overdueTasks.length === 0 && undatedTasks.length === 0
            && agendaDays.every(date => !(tasksByDate.get(date)?.length) && !(showEvents && eventsByDate.get(date)?.length));
        return (
            <div className="space-y-5">
                {overdueTasks.length > 0 && (
                    <section aria-label="Tareas atrasadas" className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-rose-300 mb-3">Atrasadas ({overdueTasks.length})</h3>
                        <div className="space-y-2">{overdueTasks.map(t => renderTaskRow(t, true))}</div>
                    </section>
                )}
                {agendaDays.map(date => {
                    const dayTasks = tasksByDate.get(date) || [];
                    const dayEvents = showEvents ? (eventsByDate.get(date) || []) : [];
                    const relative = date === todayIso ? 'Hoy' : date === tomorrowIso ? 'Mañana' : '';
                    return (
                        <section key={date}>
                            <h3 className="sticky top-0 z-10 -mx-3 px-3 py-2 mb-1 bg-gray-900/95 backdrop-blur-sm flex items-baseline gap-2">
                                {relative && <span className={`text-xs font-black uppercase tracking-widest ${date === todayIso ? 'text-purple-300' : 'text-gray-300'}`}>{relative}</span>}
                                <span className="text-sm font-semibold text-gray-300">{formatLongDate(date)}</span>
                            </h3>
                            <div className="space-y-2">
                                {dayEvents.map(ev => renderEventCard(ev))}
                                {dayTasks.map(t => renderTaskRow(t))}
                                {dayTasks.length === 0 && dayEvents.length === 0 && (
                                    <p className="text-sm text-gray-500 px-1">Nada planificado.</p>
                                )}
                            </div>
                        </section>
                    );
                })}
                {undatedTasks.length > 0 && (
                    <section aria-label="Tareas sin fecha">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Sin fecha ({undatedTasks.length})</h3>
                        <div className="space-y-2">{undatedTasks.map(t => renderTaskRow(t))}</div>
                    </section>
                )}
                {nothingPlanned && (
                    <div className="text-center py-8 rounded-xl border border-dashed border-gray-700">
                        <p className="text-sm text-gray-300 font-semibold">Todo al día</p>
                        <p className="text-sm text-gray-500 mt-1">No hay tareas ni eventos por delante.</p>
                        <button onClick={() => openNew(todayIso)} className="mt-3 text-sm font-bold text-purple-300 px-4 py-2.5 rounded-lg border border-purple-400/40 touch-manipulation">+ Añadir una tarea</button>
                    </div>
                )}
            </div>
        );
    };

    const selectedTasks = tasksByDate.get(selectedDate) || [];
    const selectedEvents = showEvents ? (eventsByDate.get(selectedDate) || []) : [];
    const selectedDaySummary = [
        selectedEvents.length > 0 ? `${selectedEvents.length} ${selectedEvents.length === 1 ? 'evento' : 'eventos'}` : '',
        selectedTasks.length > 0 ? `${selectedTasks.length} ${selectedTasks.length === 1 ? 'tarea' : 'tareas'}` : '',
    ].filter(Boolean).join(' · ') || 'Día libre';

    const editingTask = draft?.id ? tasks.find(t => t.id === draft.id) : undefined;

    return (
        <div className="p-3 pb-28 sm:p-8 sm:pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Calendario y Tareas</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 bg-gray-700/40 border border-gray-600/50 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
                        </span>
                        {overdueTasks.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                {overdueTasks.length} {overdueTasks.length === 1 ? 'atrasada' : 'atrasadas'}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rotate-45 bg-purple-400" />
                            {monthEventCount} {monthEventCount === 1 ? 'evento' : 'eventos'}<span className="hidden sm:inline">&nbsp;en {MONTH_NAMES[viewMonth].toLowerCase()}</span>
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div role="tablist" aria-label="Vista del calendario" className="sm:hidden inline-flex p-0.5 rounded-full bg-gray-800 border border-gray-700">
                        {(['month', 'agenda'] as MobileView[]).map(v => (
                            <button
                                key={v}
                                role="tab"
                                aria-selected={mobileView === v}
                                onClick={() => setMobileView(v)}
                                className={`px-4 py-2 rounded-full text-xs font-bold touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${mobileView === v ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                            >
                                {v === 'month' ? 'Mes' : 'Agenda'}
                            </button>
                        ))}
                    </div>
                    <label className="cursor-pointer" title="Mostrar u ocultar las tareas ya hechas">
                        <input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} className="sr-only peer" />
                        <span className={toggleBase}>Hechas</span>
                    </label>
                    <label className="cursor-pointer" title="Mostrar u ocultar los eventos del ERP">
                        <input type="checkbox" checked={showEvents} onChange={e => setShowEvents(e.target.checked)} className="sr-only peer" />
                        <span className={toggleBase}>Eventos</span>
                    </label>
                    <button
                        onClick={() => openNew(selectedDate)}
                        className="hidden sm:block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg text-sm outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
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

            {mobileView === 'agenda' && <div className="sm:hidden">{renderAgenda()}</div>}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                <div className={`xl:col-span-2 bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-2 sm:p-4 ${mobileView === 'agenda' ? 'hidden sm:block' : ''}`}>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <button onClick={() => goToMonth(-1)} aria-label="Mes anterior" className="p-2.5 sm:p-2 rounded-lg bg-gray-700/70 hover:bg-gray-600 text-white touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => goToMonth(1)} aria-label="Mes siguiente" className="p-2.5 sm:p-2 rounded-lg bg-gray-700/70 hover:bg-gray-600 text-white touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <h3 className="text-lg sm:text-xl font-bold text-white ml-1 sm:ml-2">{MONTH_NAMES[viewMonth]} <span className="text-gray-500 font-medium">{viewYear}</span></h3>
                        </div>
                        <button onClick={goToToday} className="px-3 py-2.5 sm:py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-purple-400/40 text-purple-200 hover:bg-purple-500/15 touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-purple-400">Hoy</button>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
                        {WEEKDAY_LABELS.map((label, i) => (
                            <div key={label} className={`text-center text-[10px] font-black uppercase tracking-widest py-1 ${i >= 5 ? 'text-gray-600' : 'text-gray-500'}`}>{label}</div>
                        ))}
                    </div>

                    <div
                        className="grid grid-cols-7 gap-0.5 sm:gap-1"
                        onTouchStart={handleGridTouchStart}
                        onTouchEnd={handleGridTouchEnd}
                    >
                        {calendarCells.map((iso, idx) => {
                            if (!iso) return <div key={`empty-${idx}`} className="min-h-[50px] sm:min-h-[84px]" />;
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
                            const isWeekend = idx % 7 >= 5;
                            const load = dayEvents.length + dayTasks.filter(t => !t.completed).length;
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
                                    className={`min-h-[50px] sm:min-h-[84px] min-w-0 items-center sm:items-stretch text-left p-1 sm:p-1.5 rounded-lg transition flex flex-col gap-0.5 sm:gap-1 touch-manipulation select-none [-webkit-tap-highlight-color:transparent] active:scale-95 motion-reduce:active:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${dayLoadTint(load)} ${isSelected ? 'ring-2 ring-purple-400' : 'hover:bg-gray-700/50'}`}
                                >
                                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-purple-600 text-white shadow-md shadow-purple-900/60' : hasOverdue ? 'text-rose-400' : isWeekend ? 'text-gray-500' : 'text-gray-300'}`}>
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
                                            <span key={`ev-${item.ev.id}`} className="text-[10px] leading-tight truncate font-semibold text-purple-100 bg-purple-500/30 rounded px-1.5 py-0.5">
                                                ★ {item.ev.time ? `${item.ev.time} ` : ''}{item.ev.name}
                                            </span>
                                        ) : (
                                            <span key={item.t.id} className={`block text-[10px] leading-tight truncate border-l-2 pl-1.5 py-0.5 rounded-r bg-black/20 ${PRIORITY_BORDER[item.t.priority]} ${item.t.completed ? 'line-through text-gray-500 opacity-70' : 'text-gray-100'}`}>
                                                {item.t.title}
                                            </span>
                                        ))}
                                        {extraItems > 0 && <span className="text-[10px] text-gray-500 font-semibold">+{extraItems} más</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="hidden sm:block text-[11px] text-gray-500 mt-3">Clic en un día para ver su detalle · doble clic para añadir una tarea · cuanto más morado el fondo, más cargado está el día · ★ evento (se gestionan en Eventos).</p>
                    <div className="sm:hidden flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500 mt-3">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 mx-0.5 rotate-45 bg-purple-400" />Evento</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />Tarea (color = prioridad)</span>
                        <span>Más morado = día más cargado</span>
                        <span>Desliza para cambiar de mes</span>
                    </div>
                </div>

                <div className={`space-y-4 sm:space-y-6 ${mobileView === 'agenda' ? 'hidden sm:block' : ''}`}>
                    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="min-w-0">
                                {selectedDate === todayIso && <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Hoy</p>}
                                <h3 className="text-base font-bold text-white">{formatLongDate(selectedDate)}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{selectedDaySummary}<span className="sm:hidden"> · toca para editar</span></p>
                            </div>
                            <button onClick={() => openNew(selectedDate)} className="flex-shrink-0 text-xs font-bold text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 rounded-full px-3 py-2.5 sm:py-1.5 touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-purple-400">+ Añadir</button>
                        </div>
                        {isLoading ? (
                            <p className="text-sm text-gray-500">Cargando tareas...</p>
                        ) : (
                            <div className="space-y-2">
                                {selectedEvents.map(ev => renderEventCard(ev))}
                                {selectedTasks.map(t => renderTaskRow(t))}
                                {selectedTasks.length === 0 && selectedEvents.length === 0 && (
                                    <div className="text-center py-6 rounded-lg border border-dashed border-gray-700">
                                        <p className="text-sm text-gray-400">Nada planificado para este día.</p>
                                        <button onClick={() => openNew(selectedDate)} className="mt-2 text-xs font-bold text-purple-300 hover:text-purple-200 px-3 py-2.5 touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded">+ Añadir una tarea</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {overdueTasks.length > 0 && (
                        <div className="bg-rose-950/20 rounded-xl border border-rose-500/30 shadow-lg p-3 sm:p-4">
                            <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider mb-3">Atrasadas ({overdueTasks.length})</h3>
                            <div className="space-y-2">{overdueTasks.map(t => renderTaskRow(t, true))}</div>
                        </div>
                    )}

                    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-3 sm:p-4">
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
                onClick={() => openNew(mobileView === 'agenda' ? todayIso : selectedDate)}
                aria-label="Nueva tarea"
                className="sm:hidden fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-20 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-900/50 flex items-center justify-center touch-manipulation active:scale-95 motion-reduce:active:scale-100 transition-transform"
            >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            </button>

            <TaskSheet
                draft={draft}
                isSaving={isSaving}
                error={saveError}
                onChange={setDraft}
                onSubmit={handleSave}
                onClose={() => setDraft(null)}
                onDelete={editingTask ? async () => { if (await handleDelete(editingTask)) setDraft(null); } : undefined}
            />
        </div>
    );
};

export default Planner;
