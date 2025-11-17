import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import Modal from './Modal';

interface TasksProps {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
}

const TaskForm: React.FC<{
  task?: Task;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt'> | Task) => void;
  onCancel: () => void;
}> = ({ task, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    dueDate: task?.dueDate || '',
    status: task?.status || 'Por Hacer' as TaskStatus,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) {
      onSubmit({ ...task, ...formData });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300">Título</label>
        <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Descripción</label>
        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Fecha de Vencimiento</label>
        <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-300">Estado</label>
        <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500">
          <option>Por Hacer</option>
          <option>En Progreso</option>
          <option>Hecho</option>
        </select>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button type="button" onClick={onCancel} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">Cancelar</button>
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">{task ? 'Actualizar' : 'Añadir'} Tarea</button>
      </div>
    </form>
  );
};

const TaskCard: React.FC<{ task: Task; onDragStart: (e: React.DragEvent, id: string) => void; onClick: () => void }> = ({ task, onDragStart, onClick }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className="bg-gray-800 p-4 rounded-md shadow-md cursor-grab active:cursor-grabbing border-l-4 border-purple-500"
    >
      <h4 className="font-bold text-white">{task.title}</h4>
      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      {task.dueDate && (
        <p className={`text-xs mt-2 ${isOverdue && task.status !== 'Hecho' ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
          Vence: {new Date(task.dueDate).toLocaleDateString('es-ES')}
        </p>
      )}
    </div>
  );
};

const KanbanColumn: React.FC<{
  title: TaskStatus;
  tasks: Task[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  openModal: (task: Task) => void;
}> = ({ title, tasks, onDragStart, onDrop, openModal }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e, title);
    setIsOver(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-gray-900/50 rounded-lg p-4 flex-1 min-w-[300px] transition-colors ${isOver ? 'bg-purple-900/20' : ''}`}
    >
      <h3 className="text-lg font-semibold mb-4 text-white border-b-2 border-purple-500 pb-2">{title} ({tasks.length})</h3>
      <div className="space-y-4 h-full overflow-y-auto">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onDragStart={onDragStart} onClick={() => openModal(task)} />
        ))}
      </div>
    </div>
  );
};


const Tasks: React.FC<TasksProps> = ({ tasks, addTask, updateTask, deleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
  };
  
  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    const taskToMove = tasks.find(t => t.id === taskId);
    if (taskToMove && taskToMove.status !== newStatus) {
      updateTask({ ...taskToMove, status: newStatus });
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

  const handleSubmit = (task: Omit<Task, 'id' | 'createdAt'> | Task) => {
    if ('id' in task) {
      updateTask(task);
    } else {
      addTask(task);
    }
    handleCloseModal();
  };

  const columns: TaskStatus[] = ['Por Hacer', 'En Progreso', 'Hecho'];

  return (
    <div className="p-4 sm:p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Tareas</h2>
        <button onClick={() => handleOpenModal()} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Añadir Tarea</button>
      </div>
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(status => (
          <KanbanColumn
            key={status}
            title={status}
            tasks={tasks.filter(t => t.status === status)}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            openModal={handleOpenModal}
          />
        ))}
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}>
        <TaskForm task={editingTask} onSubmit={handleSubmit} onCancel={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default Tasks;