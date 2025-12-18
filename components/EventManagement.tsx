
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
                    <label className="block text-sm font-medium text-gray-300">Precio (€)</label>
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Participantes ({formData.participantIds.length})</label>
                    <input
                        type="text"
                        placeholder="Buscar alumno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-2 block w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 px-3 text-sm text-gray-300 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <div className="bg-gray-900/50 border border-gray-700 rounded-md p-2 h-48 overflow-y-auto custom-scrollbar">
                        {filteredStudents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filteredStudents.map(s => (
                                    <label key={s.id} className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${formData.participantIds.includes(s.id) ? 'bg-purple-600/30 border border-purple-500/50' : 'hover:bg-gray-700/50 border border-transparent'}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.participantIds.includes(s.id)}
                                            onChange={() => toggleParticipant(s.id)}
                                            className="mr-3 h-4 w-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500"
                                        />
                                        <span className={`text-sm ${formData.participantIds.includes(s.id) ? 'text-white font-semibold' : 'text-gray-300'}`}>{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-10">No se encontraron alumnos.</p>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Observaciones</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"></textarea>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">{event ? 'Actualizar' : 'Crear'} Evento</button>
            </div>
        </form>
    );
};

const EventManagement: React.FC<EventManagementProps> = ({ events, students, addEvent, updateEvent, deleteEvent }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<DanceEvent | undefined>(undefined);
    const [filterType, setFilterType] = useState<EventType | 'Todos'>('Todos');

    const filteredEvents = useMemo(() => {
        return events
            .filter(e => filterType === 'Todos' || e.type === filterType)
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [events, filterType]);

    const handleOpenModal = (event?: DanceEvent) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingEvent(undefined);
        setIsModalOpen(false);
    };

    const handleSubmit = (eventData: Omit<DanceEvent, 'id'> | DanceEvent) => {
        if ('id' in eventData) {
            updateEvent(eventData);
        } else {
            addEvent(eventData);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`¿Seguro que quieres eliminar el evento "${name}"?`)) {
            deleteEvent(id);
        }
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-white">Gestión de Eventos</h2>
                <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-900/20 transition-all font-semibold">
                    Nuevo Evento
                </button>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {['Todos', 'Competición', 'Exhibición', 'Taller', 'Otro'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${filterType === type ? 'bg-purple-600 text-white border-purple-500 shadow-md' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                        <div key={event.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 hover:border-purple-500/50 transition-colors flex flex-col h-full">
                            <div className="p-5 flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${getTypeColor(event.type)}`}>
                                        {event.type}
                                    </span>
                                    <span className="text-green-400 font-bold">€{event.price.toFixed(2)}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{event.name}</h3>
                                <div className="space-y-2 text-sm text-gray-400">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {new Date(event.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} a las {event.time}
                                    </div>
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {event.location}
                                    </div>
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                        {event.participantIds.length} Participantes
                                    </div>
                                </div>
                                {event.notes && (
                                    <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-xs italic text-gray-500 border border-gray-700 line-clamp-3">
                                        {event.notes}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-700 flex justify-end gap-3 bg-gray-750">
                                <button onClick={() => handleOpenModal(event)} className="text-sm font-medium text-purple-400 hover:text-purple-300">Editar</button>
                                <button onClick={() => handleDelete(event.id, event.name)} className="text-sm font-medium text-red-400 hover:text-red-300">Eliminar</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        <p className="text-gray-500 font-medium">No se han registrado eventos todavía.</p>
                        <button onClick={() => handleOpenModal()} className="mt-4 text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4">Registrar primer evento</button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEvent ? 'Editar Evento' : 'Añadir Nuevo Evento'}>
                <EventForm event={editingEvent} students={students} onSubmit={handleSubmit} onCancel={handleCloseModal} />
            </Modal>
        </div>
    );
};

export default EventManagement;
