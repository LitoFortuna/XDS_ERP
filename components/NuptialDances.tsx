import React, { useState, useMemo } from 'react';
import { NuptialDance, Instructor, Rehearsal } from '../types';
import Modal from './Modal';

// --- PROPS ---
interface NuptialDancesProps {
  nuptialDances: NuptialDance[];
  instructors: Instructor[];
  addNuptialDance: (dance: Omit<NuptialDance, 'id'>) => void;
  updateNuptialDance: (dance: NuptialDance) => void;
  deleteNuptialDance: (id: string) => void;
}

// --- FORMULARIO PRINCIPAL (AÑADIR/EDITAR PAREJA) ---
const NuptialDanceForm: React.FC<{
  dance?: NuptialDance,
  instructors: Instructor[],
  onSubmit: (dance: Omit<NuptialDance, 'id'> | NuptialDance) => void,
  onCancel: () => void
}> = ({ dance, instructors, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    coupleName: dance?.coupleName || '',
    phone: dance?.phone || '',
    email: dance?.email || '',
    weddingDate: dance?.weddingDate || '',
    song: dance?.song || '',
    instructorId: dance?.instructorId || '',
    package: dance?.package || 'Básico 4h',
    totalHours: dance?.totalHours || 4,
    totalCost: dance?.totalCost || 200,
    paidAmount: dance?.paidAmount || 0,
    notes: dance?.notes || '',
  });

  const sortedInstructors = useMemo(() =>
    [...instructors].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
  [instructors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumber = ['totalHours', 'totalCost', 'paidAmount'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dance) {
      onSubmit({ ...dance, ...formData });
    } else {
      onSubmit({ ...formData, rehearsals: [] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-300">Nombre Pareja</label>
            <input type="text" name="coupleName" value={formData.coupleName} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
         <div>
            <label className="block text-sm font-medium text-gray-300">Fecha de la Boda</label>
            <input type="date" name="weddingDate" value={formData.weddingDate} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Teléfono</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Canción</label>
            <input type="text" name="song" value={formData.song} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Profesor</label>
            <select name="instructorId" value={formData.instructorId} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required>
                <option value="" disabled>Selecciona un profesor</option>
                {sortedInstructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Paquete</label>
            <input type="text" name="package" value={formData.package} onChange={handleChange} placeholder="Ej: Básico 4h" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Horas Totales</label>
            <input type="number" name="totalHours" value={formData.totalHours} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Coste Total (€)</label>
            <input type="number" name="totalCost" value={formData.totalCost} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
         <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Cantidad Pagada (€)</label>
            <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Observaciones</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button type="button" onClick={onCancel} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">Cancelar</button>
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">{dance ? 'Actualizar' : 'Añadir'}</button>
      </div>
    </form>
  );
};

// --- MODAL PARA GESTIONAR ENSAYOS ---
const RehearsalsModal: React.FC<{
    dance: NuptialDance,
    onSave: (updatedDance: NuptialDance) => void,
    onClose: () => void
}> = ({ dance, onSave, onClose }) => {
    const [rehearsals, setRehearsals] = useState<Rehearsal[]>(dance.rehearsals || []);
    const [newRehearsal, setNewRehearsal] = useState({ date: '', startTime: '', endTime: '' });

    const handleAddRehearsal = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRehearsal.date && newRehearsal.startTime && newRehearsal.endTime) {
            // Fix: Explicitly type the new rehearsal object to prevent type widening of 'status'.
            const rehearsalToAdd: Rehearsal = {
                ...newRehearsal,
                id: Date.now().toString(),
                status: 'Pendiente'
            };
            setRehearsals(prev => [...prev, rehearsalToAdd].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)));
            setNewRehearsal({ date: '', startTime: '', endTime: '' });
        }
    };
    
    const handleRehearsalChange = (id: string, field: 'status', value: Rehearsal['status']) => {
        setRehearsals(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleDeleteRehearsal = (id: string) => {
        setRehearsals(prev => prev.filter(r => r.id !== id));
    };

    const handleSaveChanges = () => {
        onSave({ ...dance, rehearsals });
    };

    const statusColor = (status: Rehearsal['status']) => {
        switch (status) {
            case 'Completado': return 'bg-green-500/20 text-green-300';
            case 'Cancelado': return 'bg-red-500/20 text-red-300';
            default: return 'bg-yellow-500/20 text-yellow-300';
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-lg font-medium text-gray-200 mb-2">Ensayos Programados</h4>
                <div className="bg-gray-900/50 rounded-md p-3 max-h-60 overflow-y-auto border border-gray-700 space-y-2">
                    {rehearsals.length > 0 ? (
                        rehearsals.map(r => (
                            <div key={r.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                                <div>
                                    <p className="font-semibold text-white">{new Date(r.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    <p className="text-sm text-gray-300">{r.startTime} - {r.endTime}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <select value={r.status} onChange={(e) => handleRehearsalChange(r.id, 'status', e.target.value as Rehearsal['status'])} className={`text-xs rounded-md border-0 focus:ring-2 focus:ring-purple-500 ${statusColor(r.status)}`}>
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Completado">Completado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                    <button onClick={() => handleDeleteRehearsal(r.id)} className="text-red-400 hover:text-red-300">&times;</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 italic text-center py-4">No hay ensayos programados.</p>
                    )}
                </div>
            </div>

            <div>
                 <h4 className="text-lg font-medium text-gray-200 mb-2">Añadir Nuevo Ensayo</h4>
                 <form onSubmit={handleAddRehearsal} className="flex flex-wrap items-end gap-4 p-4 bg-gray-900/50 rounded-md border border-gray-700">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-300">Fecha</label>
                        <input type="date" value={newRehearsal.date} onChange={e => setNewRehearsal(p => ({...p, date: e.target.value}))} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Inicio</label>
                        <input type="time" value={newRehearsal.startTime} onChange={e => setNewRehearsal(p => ({...p, startTime: e.target.value}))} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300">Fin</label>
                        <input type="time" value={newRehearsal.endTime} onChange={e => setNewRehearsal(p => ({...p, endTime: e.target.value}))} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500" required/>
                    </div>
                    <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 self-end">Añadir</button>
                 </form>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">Cancelar</button>
                <button type="button" onClick={handleSaveChanges} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Guardar Cambios</button>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
const NuptialDances: React.FC<NuptialDancesProps> = ({ nuptialDances, instructors, addNuptialDance, updateNuptialDance, deleteNuptialDance }) => {
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [isRehearsalModalOpen, setIsRehearsalModalOpen] = useState(false);
  const [selectedDance, setSelectedDance] = useState<NuptialDance | undefined>(undefined);

  const getInstructorName = (id: string) => instructors.find(i => i.id === id)?.name || 'N/A';

  const upcomingRehearsals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return nuptialDances
        .flatMap(dance => 
            (dance.rehearsals || [])
                .filter(r => r.status === 'Pendiente' && new Date(r.date + 'T00:00:00') >= today)
                .map(rehearsal => ({
                    ...rehearsal,
                    coupleName: dance.coupleName,
                    instructorName: getInstructorName(dance.instructorId)
                }))
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [nuptialDances, instructors]);
  
  const handleOpenMainModal = (dance?: NuptialDance) => {
    setSelectedDance(dance);
    setIsMainModalOpen(true);
  };

  const handleCloseMainModal = () => {
    setSelectedDance(undefined);
    setIsMainModalOpen(false);
  };
  
  const handleOpenRehearsalsModal = (dance: NuptialDance) => {
    setSelectedDance(dance);
    setIsRehearsalModalOpen(true);
  };

  const handleCloseRehearsalsModal = () => {
    setSelectedDance(undefined);
    setIsRehearsalModalOpen(false);
  };
  
  const handleSubmit = (dance: Omit<NuptialDance, 'id'> | NuptialDance) => {
    if ('id' in dance) {
      updateNuptialDance(dance);
    } else {
      addNuptialDance(dance);
    }
    handleCloseMainModal();
  };
  
  const handleRehearsalSave = (updatedDance: NuptialDance) => {
    updateNuptialDance(updatedDance);
    handleCloseRehearsalsModal();
  };

  const handleDelete = (dance: NuptialDance) => {
    if (window.confirm(`¿Seguro que quieres eliminar el baile de ${dance.coupleName}?`)) {
      deleteNuptialDance(dance.id);
    }
  };
  
  const getRehearsalProgress = (dance: NuptialDance) => {
        if (!dance.rehearsals) return { completedHours: 0, nextRehearsal: 'No hay próximos' };
        
        const completedHours = dance.rehearsals
            .filter(r => r.status === 'Completado')
            .reduce((total, r) => {
                const start = new Date(`1970-01-01T${r.startTime}`);
                const end = new Date(`1970-01-01T${r.endTime}`);
                return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0);

        const today = new Date().toISOString().split('T')[0];
        const upcoming = dance.rehearsals
            .filter(r => r.status === 'Pendiente' && r.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

        const nextRehearsal = upcoming.length > 0
            ? `${new Date(upcoming[0].date).toLocaleDateString('es-ES')} a las ${upcoming[0].startTime}`
            : 'No hay próximos';

        return { completedHours, nextRehearsal };
    };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Gestión de Bailes Nupciales</h2>
        <button onClick={() => handleOpenMainModal()} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Añadir Baile Nupcial</button>
      </div>

       <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Próximos Ensayos</h3>
            {upcomingRehearsals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {upcomingRehearsals.map(rehearsal => (
                        <div key={rehearsal.id} className="bg-gray-800 p-4 rounded-lg shadow-sm flex items-center">
                            <div className="bg-purple-500/20 text-purple-400 rounded-full p-3 mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-white">{rehearsal.coupleName}</p>
                                <p className="text-sm text-purple-300 font-semibold">{rehearsal.startTime} - {rehearsal.endTime}</p>
                                <p className="text-xs text-gray-400 capitalize">
                                    {new Date(rehearsal.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Profesor: {rehearsal.instructorName}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                    <p className="text-gray-400">No hay ensayos programados.</p>
                </div>
            )}
        </div>


      <div className="bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3">Pareja</th>
              <th scope="col" className="px-6 py-3">Fecha Boda</th>
              <th scope="col" className="px-6 py-3">Profesor</th>
              <th scope="col" className="px-6 py-3">Progreso Ensayos</th>
              <th scope="col" className="px-6 py-3">Pagos</th>
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {nuptialDances.map(dance => {
                const { completedHours, nextRehearsal } = getRehearsalProgress(dance);
                const progressPercentage = dance.totalHours > 0 ? (completedHours / dance.totalHours) * 100 : 0;
                return (
              <tr key={dance.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{dance.coupleName}</td>
                <td className="px-6 py-4">{new Date(dance.weddingDate).toLocaleDateString('es-ES')}</td>
                <td className="px-6 py-4">{getInstructorName(dance.instructorId)}</td>
                <td className="px-6 py-4">
                     <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-300 mb-1">{completedHours.toFixed(1)} / {dance.totalHours}h</span>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">Próximo: {nextRehearsal}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${dance.paidAmount >= dance.totalCost ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'}`}>
                    €{dance.paidAmount.toFixed(2)} / €{dance.totalCost.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <button onClick={() => handleOpenRehearsalsModal(dance)} className="font-medium text-green-400 hover:text-green-300 hover:underline">Ensayos</button>
                  <button onClick={() => handleOpenMainModal(dance)} className="ml-4 font-medium text-purple-400 hover:text-purple-300 hover:underline">Editar</button>
                  <button onClick={() => handleDelete(dance)} className="ml-4 font-medium text-red-400 hover:text-red-300 hover:underline">Eliminar</button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isMainModalOpen} onClose={handleCloseMainModal} title={selectedDance ? 'Editar Baile Nupcial' : 'Añadir Baile Nupcial'}>
        <NuptialDanceForm dance={selectedDance} instructors={instructors} onSubmit={handleSubmit} onCancel={handleCloseMainModal} />
      </Modal>

      <Modal isOpen={isRehearsalModalOpen} onClose={handleCloseRehearsalsModal} title={`Gestionar Ensayos de ${selectedDance?.coupleName}`}>
        {selectedDance && <RehearsalsModal dance={selectedDance} onSave={handleRehearsalSave} onClose={handleCloseRehearsalsModal} />}
      </Modal>

    </div>
  );
};

export default NuptialDances;
