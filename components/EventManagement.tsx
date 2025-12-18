
import React, { useState, useMemo } from 'react';
import { DanceEvent, Student, EventType } from '../types';
import Modal from './Modal';

interface EventManagementProps {
    events: DanceEvent[];
    students: Student[];
    addEvent: (event: Omit<DanceEvent, 'id'>) => void;
    updateEvent: (event: DanceEvent) => void;
    deleteEvent: (id: string) => void;
}

const EventForm: React.FC<{
    event?: DanceEvent;
    students: Student[];
    onSubmit: (event: Omit<DanceEvent, 'id'> | DanceEvent) => void;
    onCancel: () => void;
}> = ({ event, students, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: event?.name || '',
        type: (event?.type || 'Competición') as EventType,
        date: event?.date || new Date().toISOString().split('T')[0],
        time: event?.time || '10:00',
        location: event?.location || '',
        price: event?.price || 0,
        participantIds: event?.participantIds || [],
        notes: event?.notes || '',
    });

    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = useMemo(() => {
        return students
            .filter(s => s.active && s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [students, searchTerm]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' ? parseFloat(value) || 0 : value
        }));
    };

    const toggleParticipant = (studentId: string) => {
        setFormData(prev => {
            const newParticipants = prev.participantIds.includes(studentId)
                ? prev.participantIds.filter(id => id !== studentId)
                : [...prev.participantIds, studentId];
            return { ...prev, participantIds: newParticipants };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(event ? { ...event, ...formData } : formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Nombre del Evento</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Tipo de Evento</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500" required>
                        <option value="Competición">Competición</option>
                        <option value="Exhibición">Exhibición</option>
                        <option value="Taller">Taller</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Precio de Inscripción (€)</label>
                    <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500" required min="0" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Fecha</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Hora</label>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Ubicación</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500" required placeholder="Teatro, Estadio, Sala..." />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2 font-bold text-purple-400">Seleccionar Participantes ({formData.participantIds.length})</label>
                    <input
                        type="text"
                        placeholder="Buscar alumna por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-2 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-sm text-gray-300 focus:ring-purple-500 focus:border-purple-500 shadow-inner"
                    />
                    <div className="bg-gray-900 border border-gray-700 rounded-md p-2 h-56 overflow-y-auto custom-scrollbar">
                        {filteredStudents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filteredStudents.map(s => (
                                    <label key={s.id} className={`flex items-center p-2 rounded-md cursor-pointer transition-all ${formData.participantIds.includes(s.id) ? 'bg-purple-600/40 border border-purple-500/50 shadow-sm' : 'hover:bg-gray-700/50 border border-transparent'}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.participantIds.includes(s.id)}
                                            onChange={() => toggleParticipant(s.id)}
                                            className="mr-3 h-5 w-5 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500"
                                        />
                                        <div className="flex flex-col">
                                            <span className={`text-sm ${formData.participantIds.includes(s.id) ? 'text-white font-bold' : 'text-gray-300'}`}>{s.name}</span>
                                            {formData.participantIds.includes(s.id) && s.phone && <span className="text-[10px] text-purple-300 font-mono">{s.phone}</span>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-16">No se encontraron alumnas activas.</p>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Observaciones del Evento</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Vestuario, punto de encuentro, etc."></textarea>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                <button type="button" onClick={onCancel} className="bg-gray-600 text-gray-200 px-6 py-2.5 rounded-lg hover:bg-gray-500 transition-colors">Cancelar</button>
                <button type="submit" className="bg-purple-600 text-white px-8 py-2.5 rounded-lg hover:bg-purple-700 font-bold shadow-lg shadow-purple-900/20">{event ? 'Guardar Cambios' : 'Crear Evento'}</button>
            </div>
        </form>
    );
};

const EventManagement: React.FC<EventManagementProps> = ({ events, students, addEvent, updateEvent, deleteEvent }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<DanceEvent | undefined>(undefined);
    const [filterType, setFilterType] = useState<EventType | 'Todos'>('Todos');
    
    // View Participants Modal
    const [viewingParticipantsEvent, setViewingParticipantsEvent] = useState<DanceEvent | null>(null);

    const filteredEvents = useMemo(() => {
        return events
            .filter(e => filterType === 'Todos' || e.type === filterType)
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [events, filterType]);

    const handleOpenFormModal = (event?: DanceEvent) => {
        setEditingEvent(event);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setEditingEvent(undefined);
        setIsFormModalOpen(false);
    };

    const handleSubmit = (eventData: Omit<DanceEvent, 'id'> | DanceEvent) => {
        if ('id' in eventData) {
            updateEvent(eventData);
        } else {
            addEvent(eventData);
        }
        handleCloseFormModal();
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`¿Seguro que quieres eliminar el evento "${name}"?`)) {
            deleteEvent(id);
        }
    };

    const handleExportCSV = (event: DanceEvent) => {
        const participantList = event.participantIds
            .map(id => students.find(s => s.id === id))
            .filter(Boolean)
            .sort((a, b) => a!.name.localeCompare(b!.name));

        if (participantList.length === 0) {
            alert("No hay participantes para exportar.");
            return;
        }

        const headers = ['Nombre', 'Teléfono', 'Email', 'Suscripción'];
        const rows = participantList.map(s => [
            s!.name, 
            s!.phone || '-', 
            s!.email || '-', 
            s!.active ? 'Activo' : 'Inactivo'
        ]);
        
        const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `Participantes_${event.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getTypeColor = (type: EventType) => {
        switch (type) {
            case 'Competición': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            case 'Exhibición': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'Taller': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Gestión de Eventos</h2>
                    <p className="text-gray-400 mt-1">Organiza competiciones, exhibiciones y talleres.</p>
                </div>
                <button onClick={() => handleOpenFormModal()} className="w-full sm:w-auto bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700 shadow-xl shadow-purple-900/20 transition-all font-bold flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Nuevo Evento
                </button>
            </div>

            <div className="mb-8 flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                {['Todos', 'Competición', 'Exhibición', 'Taller', 'Otro'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border whitespace-nowrap ${filterType === type ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/40' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                        <div key={event.id} className="bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-purple-500/50 transition-all group flex flex-col h-full">
                            <div className="p-6 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] uppercase font-black tracking-widest ${getTypeColor(event.type)}`}>
                                        {event.type}
                                    </span>
                                    <div className="text-right">
                                        <p className="text-green-400 font-bold text-xl leading-none">€{event.price.toFixed(0)}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">por alumna</p>
                                    </div>
                                </div>
                                
                                <h3 className="text-xl font-black text-white mb-4 group-hover:text-purple-300 transition-colors line-clamp-2">{event.name}</h3>
                                
                                <div className="space-y-3 text-sm text-gray-400">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mr-3 text-purple-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-white font-bold">{new Date(event.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                                            <p className="text-[11px] uppercase tracking-tighter">Hora: {event.time}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mr-3 text-purple-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                        </div>
                                        <p className="text-white font-medium">{event.location}</p>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mr-3 text-purple-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-white font-bold">{event.participantIds.length} Alumnas</p>
                                            <p className="text-[11px] text-green-400 uppercase font-bold">Total: €{(event.price * event.participantIds.length).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {event.notes && (
                                    <div className="mt-5 p-4 bg-gray-900/80 rounded-xl text-xs italic text-gray-500 border border-gray-700 leading-relaxed">
                                        {event.notes}
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 bg-gray-900/50 border-t border-gray-700/50 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setViewingParticipantsEvent(event)}
                                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center px-3 py-1.5 rounded-lg hover:bg-blue-400/10 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                        Lista
                                    </button>
                                    <button 
                                        onClick={() => handleExportCSV(event)}
                                        className="text-xs font-bold text-green-400 hover:text-green-300 flex items-center px-3 py-1.5 rounded-lg hover:bg-green-400/10 transition-colors"
                                        title="Exportar CSV"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                                
                                <div className="flex gap-4">
                                    <button onClick={() => handleOpenFormModal(event)} className="text-sm font-bold text-purple-400 hover:text-purple-300">Editar</button>
                                    <button onClick={() => handleDelete(event.id, event.name)} className="text-sm font-bold text-red-500 hover:text-red-400">Borrar</button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center bg-gray-800/20 border-2 border-dashed border-gray-700/50 rounded-3xl">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-600 border border-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">Sin eventos programados</h4>
                        <p className="text-gray-500 max-w-xs mx-auto mb-8">Empieza a planificar tu temporada registrando una nueva competición o taller.</p>
                        <button onClick={() => handleOpenFormModal()} className="text-purple-400 hover:text-purple-300 font-black uppercase tracking-widest text-xs border-b-2 border-purple-500/30 pb-1 transition-all">Registrar ahora</button>
                    </div>
                )}
            </div>

            {/* FORM MODAL */}
            <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={editingEvent ? 'Editar Detalles del Evento' : 'Crear Nuevo Evento'}>
                <EventForm event={editingEvent} students={students} onSubmit={handleSubmit} onCancel={handleCloseFormModal} />
            </Modal>

            {/* VIEW PARTICIPANTS MODAL */}
            <Modal 
                isOpen={!!viewingParticipantsEvent} 
                onClose={() => setViewingParticipantsEvent(null)} 
                title={`Participantes: ${viewingParticipantsEvent?.name}`}
            >
                {viewingParticipantsEvent && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                             <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Total Alumnas</span>
                                <span className="text-2xl font-black text-white">{viewingParticipantsEvent.participantIds.length}</span>
                             </div>
                             <div className="flex flex-col text-right">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Recaudación Prevista</span>
                                <span className="text-2xl font-black text-green-400">€{(viewingParticipantsEvent.price * viewingParticipantsEvent.participantIds.length).toLocaleString()}</span>
                             </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto custom-scrollbar bg-gray-900 rounded-xl border border-gray-700">
                            {viewingParticipantsEvent.participantIds.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-gray-800 text-[10px] uppercase font-black text-gray-500 border-b border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3">Nombre Alumna</th>
                                            <th className="px-4 py-3">Teléfono</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {viewingParticipantsEvent.participantIds.map(id => {
                                            const student = students.find(s => s.id === id);
                                            return (
                                                <tr key={id} className="hover:bg-gray-800/40">
                                                    <td className="px-4 py-3 font-bold text-white text-sm">{student?.name || 'Alumna eliminada'}</td>
                                                    <td className="px-4 py-3 font-mono text-xs text-purple-400">{student?.phone || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-10 text-center text-gray-500 italic">No hay alumnas inscritas todavía.</div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <button 
                                onClick={() => handleExportCSV(viewingParticipantsEvent)}
                                className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-600 transition-colors"
                            >
                                Descargar Lista (CSV)
                            </button>
                            <button 
                                onClick={() => setViewingParticipantsEvent(null)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default EventManagement;
