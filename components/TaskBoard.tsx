
import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Task, TaskStatus } from '../types';
import Modal from './Modal';
import { TrashIcon } from './icons/TrashIcon';

interface TaskBoardProps {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
}

const TaskForm: React.FC<{
  task?: Task;
  onSubmit: (task: Omit<Task, 'id'> | Task) => void;
  onCancel: () => void;
}> = ({ task, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo || '',
    dueDate: task?.dueDate || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) {
      onSubmit({ ...task, ...formData });
    } else {
      onSubmit({
        ...formData,
        status: 'Pendiente' as TaskStatus,
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300">Título</label>
        <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Descripción (Opcional)</label>
        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Asignado a (Opcional)</label>
        <input type="text" name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Fecha de Vencimiento (Opcional)</label>
        <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button type="button" onClick={onCancel} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">Cancelar</button>
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">{task ? 'Actualizar Tarea' : 'Crear Tarea'}</button>
      </div>
    </form>
  );
};

const TaskCard: React.FC<{ task: Task; index: number; onEdit: (task: Task) => void; onDelete: (id: string) => void; }> = ({ task, index, onEdit, onDelete }) => {
    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-gray-800 p-3 rounded-md shadow-sm mb-3 border-l-4 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-purple-500' : ''} border-purple-500 cursor-pointer group`}
                    onClick={() => onEdit(task)}
                >
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-white">{task.title}</h4>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                           <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                    {task.description && <p className="text-sm text-gray-400 mt-1 truncate">{task.description}</p>}
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>{task.assignedTo || 'Sin asignar'}</span>
                        {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString('es-ES')}</span>}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, addTask, updateTask, deleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const columns: Record<TaskStatus, Task[]> = useMemo(() => ({
    'Pendiente': tasks.filter(t => t.status === 'Pendiente'),
    'En Proceso': tasks.filter(t => t.status === 'En Proceso'),
    'Completada': tasks.filter(t => t.status === 'Completada'),
  }), [tasks]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const task = tasks.find(t => t.id === draggableId);
    if (task && source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as TaskStatus;
      updateTask({ ...task, status: newStatus });
    }
  };

  const handleOpenModal = (task?: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTask(undefined);
    setIsModalOpen(false);
  };
  
  const handleSubmit = (taskData: Omit<Task, 'id'> | Task) => {
    if ('id' in taskData) {
      updateTask(taskData);
    } else {
      addTask(taskData);
    }
    handleCloseModal();
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        deleteTask(id);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Tablero de Tareas</h2>
        <button onClick={() => handleOpenModal()} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Nueva Tarea</button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(columns) as TaskStatus[]).map(status => (
            <div key={status} className="bg-gray-900/50 rounded-lg p-4 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 border-b-2 border-gray-700 pb-2 text-white">{status} ({columns[status].length})</h3>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-grow min-h-[200px] rounded-md transition-colors ${snapshot.isDraggingOver ? 'bg-gray-700/50' : ''}`}
                  >
                    {columns[status].map((task, index) => (
                      <TaskCard key={task.id} task={task} index={index} onEdit={handleOpenModal} onDelete={handleDelete} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}>
        <TaskForm task={editingTask} onSubmit={handleSubmit} onCancel={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default TaskBoard;