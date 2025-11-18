import React, { useState, useMemo } from 'react';
import { Student, DanceClass, PaymentMethod } from '../types';
import Modal from './Modal';

interface StudentListProps {
  students: Student[];
  classes: DanceClass[];
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
}

type SortKey = keyof Student | 'enrolledClasses';
type SortDirection = 'asc' | 'desc';

const StudentForm: React.FC<{ 
    student?: Student, 
    classes: DanceClass[],
    onSubmit: (student: Omit<Student, 'id'> | Student) => void, 
    onCancel: () => void 
}> = ({ student, classes, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    birthDate: student?.birthDate || '',
    enrollmentDate: student?.enrollmentDate || new Date().toISOString().split('T')[0],
    enrolledClassIds: student?.enrolledClassIds || [],
    monthlyFee: student?.monthlyFee || 19,
    paymentMethod: student?.paymentMethod || 'Efectivo' as PaymentMethod,
    iban: student?.iban || '',
    active: student?.active !== undefined ? student.active : true,
    notes: student?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'select-multiple') {
        const { options } = e.target as HTMLSelectElement;
        const selectedIds: string[] = [];
        for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                selectedIds.push(options[i].value);
            }
        }
        setFormData(prev => ({ ...prev, [name]: selectedIds }));
    } else if (name === 'monthlyFee') {
        setFormData(prev => ({...prev, [name]: parseFloat(value) || 0 }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (student) {
      onSubmit({ ...student, ...formData });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-300">Nombre</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Fecha de Alta</label>
            <input type="date" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Fecha de Nacimiento</label>
            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Teléfono</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Clases Inscritas</label>
          <select multiple name="enrolledClassIds" value={formData.enrolledClassIds} onChange={handleChange} className="mt-1 block w-full h-32 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.days.join(', ')} {c.startTime})</option>)}
          </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Cuota Mensual (€)</label>
            <input type="number" name="monthlyFee" value={formData.monthlyFee} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required min="0" step="1" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300">Forma de Pago</label>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Domiciliación</option>
                <option>Bizum</option>
            </select>
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">IBAN (opcional)</label>
            <input type="text" name="iban" value={formData.iban} onChange={handleChange} placeholder="ES00 0000 0000 0000 0000 0000" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Observaciones</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
        </div>
        <div className="flex items-center">
            <input type="checkbox" name="active" id="active" checked={formData.active} onChange={handleChange} className="h-4 w-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 focus:ring-offset-gray-800" />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-200">Activo</label>
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button type="button" onClick={onCancel} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">Cancelar</button>
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">{student ? 'Actualizar' : 'Añadir'} Alumno</button>
      </div>
    </form>
  );
};

const StudentList: React.FC<StudentListProps> = ({ students, classes, addStudent, updateStudent, deleteStudent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: SortDirection }>({ key: 'name', direction: 'asc' });

  const getEnrolledClassNames = (classIds: string[]): string => {
    if (!classIds || classIds.length === 0) return 'Ninguna';
    return classIds
        .map(id => classes.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');
  };
  
  const sortedAndFilteredStudents = useMemo(() => {
    let sortableStudents = [...students].filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    sortableStudents.sort((a, b) => {
      const key = sortConfig.key;
      let aValue: any = key === 'enrolledClasses' ? getEnrolledClassNames(a.enrolledClassIds) : a[key as keyof Student];
      let bValue: any = key === 'enrolledClasses' ? getEnrolledClassNames(b.enrolledClassIds) : b[key as keyof Student];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'es', { sensitivity: 'base' });
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      // Fallback for non-string types
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortableStudents;
  }, [students, searchQuery, sortConfig, classes]);


  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const handleOpenModal = (student?: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingStudent(undefined);
    setIsModalOpen(false);
  };

  const handleSubmit = (student: Omit<Student, 'id'> | Student) => {
    if ('id' in student) {
      updateStudent(student);
    } else {
      addStudent(student);
    }
    handleCloseModal();
  };
  
  const handleDeleteRequest = (student: Student) => {
    setStudentToDelete(student);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  const sanitizeCSVCell = (cellData: any): string => {
    const cellString = String(cellData ?? '');
    if (/[";\n\r]/.test(cellString)) {
      return `"${cellString.replace(/"/g, '""')}"`;
    }
    return cellString;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const headers = [
      'Nombre', 'Fecha de Alta', 'Fecha de Nacimiento', 'Teléfono', 'Email', 
      'Clases Inscritas', 'Cuota Mensual (€)', 'Forma de Pago', 'IBAN', 'Activo', 'Observaciones'
    ];
    
    const dataToExport = sortedAndFilteredStudents.map(student => ([
      student.name,
      new Date(student.enrollmentDate).toLocaleDateString('es-ES'),
      new Date(student.birthDate).toLocaleDateString('es-ES'),
      student.phone,
      student.email,
      getEnrolledClassNames(student.enrolledClassIds),
      student.monthlyFee.toFixed(2),
      student.paymentMethod,
      student.iban || '',
      student.active ? 'Sí' : 'No',
      student.notes || ''
    ]));

    const csvContent = [
      headers.map(sanitizeCSVCell).join(';'),
      ...dataToExport.map(row => row.map(sanitizeCSVCell).join(';'))
    ].join('\n');

    downloadCSV(csvContent, 'alumnos.csv');
  };
  
  const SortableHeader: React.FC<{ sortKey: SortKey; children: React.ReactNode; }> = ({ sortKey, children }) => (
    <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-600" onClick={() => requestSort(sortKey)}>
      {children} {getSortIndicator(sortKey)}
    </th>
  );


  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Alumnos</h2>
        <div className="flex items-center gap-4">
            <button onClick={handleExportCSV} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Exportar a CSV
            </button>
            <button onClick={() => handleOpenModal()} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Añadir Alumno</button>
        </div>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-sm bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <div className="bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-gray-700">
            <tr>
              <SortableHeader sortKey="name">Nombre</SortableHeader>
              <SortableHeader sortKey="enrollmentDate">Fecha de Alta</SortableHeader>
              <th scope="col" className="px-6 py-3">Teléfono</th>
              <SortableHeader sortKey="enrolledClasses">Clases Inscritas</SortableHeader>
              <SortableHeader sortKey="monthlyFee">Cuota Mensual</SortableHeader>
              <SortableHeader sortKey="paymentMethod">Forma de Pago</SortableHeader>
              <SortableHeader sortKey="active">Estado</SortableHeader>
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredStudents.map(student => (
              <tr key={student.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{student.name}</td>
                <td className="px-6 py-4">{new Date(student.enrollmentDate).toLocaleDateString('es-ES')}</td>
                <td className="px-6 py-4">{student.phone}</td>
                <td className="px-6 py-4">{getEnrolledClassNames(student.enrolledClassIds)}</td>
                <td className="px-6 py-4">€{student.monthlyFee.toFixed(2)}</td>
                <td className="px-6 py-4">{student.paymentMethod}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {student.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleOpenModal(student)} className="font-medium text-purple-400 hover:text-purple-300 hover:underline">Editar</button>
                  <button onClick={() => handleDeleteRequest(student)} className="ml-4 font-medium text-red-400 hover:text-red-300 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingStudent ? 'Editar Alumno' : 'Añadir Nuevo Alumno'}>
        <StudentForm student={editingStudent} classes={classes} onSubmit={handleSubmit} onCancel={handleCloseModal} />
      </Modal>
      <Modal isOpen={!!studentToDelete} onClose={() => setStudentToDelete(null)} title="Confirmar Eliminación">
        {studentToDelete && (
          <div>
            <p className="text-gray-300">
              ¿Estás seguro de que quieres eliminar a <span className="font-bold text-white">{studentToDelete.name}</span>?
            </p>
            <p className="text-sm text-yellow-400 mt-2">Esta acción no se puede deshacer y se eliminarán todos los datos asociados.</p>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setStudentToDelete(null)} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                Eliminar Alumno
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentList;
