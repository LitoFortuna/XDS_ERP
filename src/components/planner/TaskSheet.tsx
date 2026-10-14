import React, { useEffect, useRef, useState } from 'react';
import { PlannerTaskCategory, PlannerTaskPriority } from '../../../types';
import { CATEGORIES, PRIORITY_LABEL, PRIORITY_DOT, addDaysIso } from '../../utils/plannerUtils';

export interface TaskDraft {
    id?: string;
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: PlannerTaskPriority;
    category: PlannerTaskCategory;
}

export const emptyDraft = (dueDate: string): TaskDraft => ({
    title: '',
    description: '',
    dueDate,
    dueTime: '',
    priority: 'medium',
    category: 'Administrativo',
});

interface TaskSheetProps {
    draft: TaskDraft | null;
    isSaving: boolean;
    error: string;
    onChange: (draft: TaskDraft) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    onDelete?: () => void;
}

const fieldClass = 'w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';

const PRIORITY_SELECTED: Record<PlannerTaskPriority, string> = {
    high: 'bg-rose-500/20 border-rose-400 text-rose-100',
    medium: 'bg-amber-500/20 border-amber-400 text-amber-100',
    low: 'bg-sky-500/20 border-sky-400 text-sky-100',
};

const choiceBase = 'min-h-[44px] px-3 rounded-lg border text-sm font-semibold transition-colors touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-purple-400';
const choiceIdle = 'bg-gray-700/40 border-gray-600 text-gray-300 hover:bg-gray-700';

// En móvil se muestra como hoja que sube desde abajo (se alcanza con el pulgar y deja ver el
// calendario detrás); desde `sm` es un diálogo centrado. Se monta solo mientras está abierta, así
// la animación de entrada se reproduce cada vez.
const OpenSheet: React.FC<Omit<TaskSheetProps, 'draft'> & { draft: TaskDraft }> = ({ draft, isSaving, error, onChange, onSubmit, onClose, onDelete }) => {
    const [entered, setEntered] = useState(false);
    const downTarget = useRef<EventTarget | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const today = new Date();
    const quickDates = [
        { label: 'Hoy', value: addDaysIso(today, 0) },
        { label: 'Mañana', value: addDaysIso(today, 1) },
        { label: 'En 1 semana', value: addDaysIso(today, 7) },
    ];

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
            onMouseDown={e => { downTarget.current = e.target; }}
            onClick={e => {
                if (e.target === overlayRef.current && downTarget.current === overlayRef.current) onClose();
                downTarget.current = null;
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="task-sheet-title"
                className={`w-full sm:max-w-lg bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] sm:m-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${entered ? 'translate-y-0' : 'translate-y-full sm:translate-y-0'}`}
            >
                <div className="sm:hidden pt-2 flex justify-center" aria-hidden="true">
                    <span className="h-1 w-10 rounded-full bg-gray-600" />
                </div>
                <div className="flex items-center justify-between px-4 sm:px-6 pt-2 pb-3 sm:py-4 sm:border-b sm:border-gray-700">
                    <h3 id="task-sheet-title" className="text-lg sm:text-xl font-semibold text-white">{draft.id ? 'Editar tarea' : 'Nueva tarea'}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="p-2.5 -mr-2 sm:mr-0 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1">
                    <div className="overflow-y-auto overscroll-contain px-4 sm:px-6 pb-4 space-y-5 flex-1">
                        <div>
                            <label htmlFor="task-title" className={labelClass}>Título</label>
                            <input
                                id="task-title"
                                type="text"
                                value={draft.title}
                                onChange={e => onChange({ ...draft, title: e.target.value })}
                                placeholder="Ej: Preparar la coreografía de fin de curso"
                                className={fieldClass}
                                autoFocus={!draft.id}
                                required
                            />
                        </div>

                        <div>
                            <span className={labelClass}>Fecha</span>
                            <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Fechas rápidas">
                                {quickDates.map(q => (
                                    <button
                                        key={q.label}
                                        type="button"
                                        onClick={() => onChange({ ...draft, dueDate: q.value })}
                                        aria-pressed={draft.dueDate === q.value}
                                        className={`${choiceBase} ${draft.dueDate === q.value ? 'bg-purple-500/25 border-purple-400 text-purple-100' : choiceIdle}`}
                                    >
                                        {q.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => onChange({ ...draft, dueDate: '', dueTime: '' })}
                                    aria-pressed={!draft.dueDate}
                                    className={`${choiceBase} ${!draft.dueDate ? 'bg-purple-500/25 border-purple-400 text-purple-100' : choiceIdle}`}
                                >
                                    Sin fecha
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="date"
                                    aria-label="Fecha"
                                    value={draft.dueDate}
                                    onChange={e => onChange({ ...draft, dueDate: e.target.value })}
                                    className={fieldClass}
                                />
                                <input
                                    type="time"
                                    aria-label="Hora (opcional)"
                                    value={draft.dueTime}
                                    onChange={e => onChange({ ...draft, dueTime: e.target.value })}
                                    disabled={!draft.dueDate}
                                    className={`${fieldClass} disabled:opacity-40`}
                                />
                            </div>
                            {!draft.dueDate && <p className="text-xs text-gray-500 mt-2">Sin fecha, la tarea queda en "Sin fecha" hasta que la planifiques.</p>}
                        </div>

                        <div>
                            <span id="task-priority-label" className={labelClass}>Prioridad</span>
                            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="task-priority-label">
                                {(['high', 'medium', 'low'] as PlannerTaskPriority[]).map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        role="radio"
                                        aria-checked={draft.priority === p}
                                        onClick={() => onChange({ ...draft, priority: p })}
                                        className={`${choiceBase} flex items-center justify-center gap-2 ${draft.priority === p ? PRIORITY_SELECTED[p] : choiceIdle}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`} />
                                        {PRIORITY_LABEL[p]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span id="task-category-label" className={labelClass}>Categoría</span>
                            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="task-category-label">
                                {CATEGORIES.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        role="radio"
                                        aria-checked={draft.category === c}
                                        onClick={() => onChange({ ...draft, category: c })}
                                        className={`${choiceBase} ${draft.category === c ? 'bg-purple-500/25 border-purple-400 text-purple-100' : choiceIdle}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="task-description" className={labelClass}>Descripción (opcional)</label>
                            <textarea
                                id="task-description"
                                value={draft.description}
                                onChange={e => onChange({ ...draft, description: e.target.value })}
                                rows={3}
                                className={fieldClass}
                            />
                        </div>

                        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
                    </div>

                    <div className="flex items-center gap-3 px-4 sm:px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-gray-700 bg-gray-800 sm:rounded-b-xl">
                        {onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="min-h-[44px] px-4 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                            >
                                Eliminar
                            </button>
                        )}
                        <div className="flex-1" />
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-[44px] px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !draft.title.trim()}
                            className="min-h-[44px] px-6 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TaskSheet: React.FC<TaskSheetProps> = ({ draft, ...rest }) => {
    if (!draft) return null;
    return <OpenSheet draft={draft} {...rest} />;
};

export default TaskSheet;
