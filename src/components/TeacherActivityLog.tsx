import React, { useCallback, useEffect, useState } from 'react';
import PageHeader from './ui/PageHeader';
import TeacherActivityTimeline from './TeacherActivityTimeline';
import { useAppStore } from '../store/useAppStore';
import {
    fetchTeacherActivity, TeacherActivityEntry, TeacherActivitySummary, TeacherActivityFilters, TeacherActivityType,
} from '../services/domain/teacherActivityService';
import { ACTIVITY_TYPE_OPTIONS, relativeTime } from '../utils/teacherActivityView';

const selectClass = 'w-full bg-gray-700 border border-gray-600 rounded-md py-2.5 sm:py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500';

// Registro histórico de lo que hacen los profesores en el ERP: cuándo entran y qué acciones realizan
// (pasar lista, corregirla, cambiar la contraseña…) más lo que la administración hace con su cuenta.
// Solo SuperAdmin; el registro lo escribe el servidor, así que el profesor no puede alterarlo.
const TeacherActivityLog: React.FC = () => {
    const userProfile = useAppStore(state => state.userProfile);
    const [filters, setFilters] = useState<TeacherActivityFilters>({ instructorId: '', type: '', from: '', to: '' });
    const [entries, setEntries] = useState<TeacherActivityEntry[]>([]);
    const [teachers, setTeachers] = useState<TeacherActivitySummary[]>([]);
    const [nextBefore, setNextBefore] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');

    const isSuperAdmin = userProfile?.role === 'SuperAdmin';

    const load = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const page = await fetchTeacherActivity(filters);
            setEntries(page.entries);
            setHasMore(page.hasMore);
            setNextBefore(page.nextBefore);
            if (page.teachers) setTeachers(page.teachers);
        } catch (err) {
            console.error('[TeacherActivityLog] Error cargando el registro:', err);
            setError('No se ha podido cargar el registro. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => { if (isSuperAdmin) void load(); }, [load, isSuperAdmin]);

    const loadMore = async () => {
        if (!nextBefore || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const page = await fetchTeacherActivity(filters, nextBefore);
            setEntries(prev => [...prev, ...page.entries]);
            setHasMore(page.hasMore);
            setNextBefore(page.nextBefore);
        } catch (err) {
            console.error('[TeacherActivityLog] Error cargando más:', err);
            setError('No se ha podido cargar más actividad.');
        } finally {
            setIsLoadingMore(false);
        }
    };

    const setFilter = (patch: Partial<TeacherActivityFilters>) => setFilters(prev => ({ ...prev, ...patch }));
    const hasFilters = !!(filters.instructorId || filters.type || filters.from || filters.to);

    if (!isSuperAdmin) {
        return (
            <div className="p-4 sm:p-8">
                <PageHeader title="Actividad de profesores" />
                <p className="text-gray-400">Este registro solo está disponible para el SuperAdmin.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8">
            <PageHeader
                title="Actividad de profesores"
                subtitle="Cuándo entran al ERP y qué acciones realizan"
                actions={
                    <button onClick={() => void load()} className="col-span-2 md:col-auto bg-gray-600 text-white px-4 py-2.5 md:py-2 rounded-md hover:bg-gray-500 flex items-center justify-center">
                        Actualizar
                    </button>
                }
            />

            <section aria-label="Último acceso de cada profesor" className="mb-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Último acceso</h2>
                {teachers.length === 0 ? (
                    <p className="text-sm text-gray-400">Todavía no hay profesores con acceso al ERP.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {teachers.map(t => (
                            <button
                                key={t.instructorId}
                                onClick={() => setFilter({ instructorId: filters.instructorId === t.instructorId ? '' : t.instructorId })}
                                aria-pressed={filters.instructorId === t.instructorId}
                                className={`text-left rounded-xl border p-4 transition-colors ${filters.instructorId === t.instructorId ? 'border-purple-400 bg-purple-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}
                            >
                                <p className="font-semibold text-white truncate">{t.name}</p>
                                <p className="text-xs text-gray-400 truncate">{t.email}</p>
                                <p className={`text-sm mt-2 font-medium ${t.lastAccessAt ? 'text-emerald-300' : 'text-gray-500'}`}>
                                    {t.lastAccessAt ? `Última vez ${relativeTime(t.lastAccessAt)}` : relativeTime(null)}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section aria-label="Filtros" className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-800 border border-gray-700 rounded-xl p-3 sm:p-4">
                <div>
                    <label htmlFor="act-teacher" className="block text-xs font-medium text-gray-400 mb-1">Profesor</label>
                    <select id="act-teacher" value={filters.instructorId || ''} onChange={e => setFilter({ instructorId: e.target.value })} className={selectClass}>
                        <option value="">Todos</option>
                        {teachers.map(t => <option key={t.instructorId} value={t.instructorId}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="act-type" className="block text-xs font-medium text-gray-400 mb-1">Acción</label>
                    <select id="act-type" value={filters.type || ''} onChange={e => setFilter({ type: e.target.value as TeacherActivityType | '' })} className={selectClass}>
                        <option value="">Todas</option>
                        {ACTIVITY_TYPE_OPTIONS.map(o => <option key={o.type} value={o.type}>{o.icon} {o.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="act-from" className="block text-xs font-medium text-gray-400 mb-1">Desde</label>
                    <input id="act-from" type="date" value={filters.from || ''} max={filters.to || undefined} onChange={e => setFilter({ from: e.target.value })} className={selectClass} />
                </div>
                <div>
                    <label htmlFor="act-to" className="block text-xs font-medium text-gray-400 mb-1">Hasta</label>
                    <input id="act-to" type="date" value={filters.to || ''} min={filters.from || undefined} onChange={e => setFilter({ to: e.target.value })} className={selectClass} />
                </div>
                {hasFilters && (
                    <div className="sm:col-span-2 lg:col-span-4">
                        <button onClick={() => setFilters({ instructorId: '', type: '', from: '', to: '' })} className="text-sm font-semibold text-purple-300 hover:text-purple-200 underline min-h-[44px] sm:min-h-0">
                            Quitar filtros
                        </button>
                    </div>
                )}
            </section>

            {error && <p role="alert" className="mb-4 text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</p>}

            {isLoading ? (
                <div className="flex justify-center py-12" role="status" aria-label="Cargando">
                    <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin" />
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-gray-700 text-gray-400">
                    {hasFilters ? 'No hay actividad con esos filtros.' : 'Todavía no hay actividad registrada. Aparecerá aquí cuando los profesores entren y pasen lista.'}
                </div>
            ) : (
                <div className="space-y-6">
                    <TeacherActivityTimeline entries={entries} />

                    {hasMore && (
                        <div className="text-center">
                            <button
                                onClick={() => void loadMore()}
                                disabled={isLoadingMore}
                                className="min-h-[44px] px-6 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold"
                            >
                                {isLoadingMore ? 'Cargando…' : 'Cargar más'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherActivityLog;
