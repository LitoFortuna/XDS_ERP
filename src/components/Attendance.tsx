
import React, { useState, useMemo, useEffect } from 'react';
import { DanceClass, Student, AttendanceRecord, DayOfWeek } from '../../types';

interface AttendanceProps {
    students: Student[];
    classes: DanceClass[];
    attendanceRecords: AttendanceRecord[];
    onSaveAttendance: (record: Omit<AttendanceRecord, 'id'> | AttendanceRecord) => void;
}

const Attendance: React.FC<AttendanceProps> = ({ students, classes, attendanceRecords, onSaveAttendance }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [presentStudentIds, setPresentStudentIds] = useState<Set<string>>(new Set());
    const [notes, setNotes] = useState('');
    const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showAllClasses, setShowAllClasses] = useState(false);

    // Get the day of the week for the selected date
    const selectedDayName = useMemo(() => {
        if (!selectedDate) return '';
        // Add time to avoid timezone shifts to previous day
        const date = new Date(selectedDate + 'T12:00:00');
        const days: DayOfWeek[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[date.getDay()];
    }, [selectedDate]);

    // Sorted classes logic: Mon -> Sun, then by Time
    const sortedClassesList = useMemo(() => {
        const dayMap: { [key: string]: number } = {
            'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 7
        };

        const getFirstDayValue = (days: DayOfWeek[]) => {
            if (!days || days.length === 0) return 99;
            return Math.min(...days.map(d => dayMap[d] || 99));
        };

        const list = [...classes].sort((a, b) => {
            const dayA = getFirstDayValue(a.days);
            const dayB = getFirstDayValue(b.days);

            if (dayA !== dayB) {
                return dayA - dayB;
            }
            return a.startTime.localeCompare(b.startTime);
        });

        if (showAllClasses) return list;

        // Filter by current selected day if not showing all
        return list.filter(c => c.days.includes(selectedDayName as DayOfWeek));
    }, [classes, showAllClasses, selectedDayName]);

    // Get students enrolled in selected class
    const enrolledStudents = useMemo(() => {
        if (!selectedClassId) return [];
        return students
            .filter(s => s.active && s.enrolledClassIds.includes(selectedClassId))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedClassId, students]);

    // Load existing attendance data when class/date changes
    useEffect(() => {
        if (selectedClassId && selectedDate) {
            const existingRecord = attendanceRecords.find(
                r => r.classId === selectedClassId && r.date === selectedDate
            );

            if (existingRecord) {
                setPresentStudentIds(new Set(existingRecord.presentStudentIds));
                setNotes(existingRecord.notes || '');
                setCurrentRecordId(existingRecord.id);
            } else {
                setPresentStudentIds(new Set());
                setNotes('');
                setCurrentRecordId(null);
            }
        }
    }, [selectedClassId, selectedDate, attendanceRecords]);

    const handleToggleStudent = (studentId: string) => {
        const newSet = new Set(presentStudentIds);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        setPresentStudentIds(newSet);
    };

    const handleMarkAll = () => {
        const allIds = new Set(enrolledStudents.map(s => s.id));
        setPresentStudentIds(allIds);
    };

    const handleClearAll = () => {
        setPresentStudentIds(new Set());
    };

    const handleSave = () => {
        if (!selectedClassId) {
            alert('Selecciona una clase primero.');
            return;
        }

        const recordData = {
            classId: selectedClassId,
            date: selectedDate,
            presentStudentIds: Array.from(presentStudentIds),
            notes: notes
        };

        if (currentRecordId) {
            onSaveAttendance({ ...recordData, id: currentRecordId });
        } else {
            onSaveAttendance(recordData);
        }

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    // --- CSV EXPORT LOGIC ---
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

    const handleExportSpecificClass = () => {
        if (!selectedClassId) return;
        const selectedClass = classes.find(c => c.id === selectedClassId);
        if (!selectedClass) return;

        const classRecords = attendanceRecords
            .filter(r => r.classId === selectedClassId)
            .sort((a, b) => a.date.localeCompare(b.date));

        if (classRecords.length === 0) {
            alert("No hay registros para esta clase.");
            return;
        }

        const headers = ['Alumno', ...classRecords.map(r => new Date(r.date).toLocaleDateString('es-ES')), 'Total', '%'];
        const rows = enrolledStudents.map(student => {
            let presentCount = 0;
            const dateCells = classRecords.map(record => {
                const isPresent = record.presentStudentIds.includes(student.id);
                if (isPresent) presentCount++;
                return isPresent ? 'P' : '-';
            });
            const totalDates = classRecords.length;
            const percentage = totalDates > 0 ? Math.round((presentCount / totalDates) * 100) : 0;
            return [student.name, ...dateCells, String(presentCount), `${percentage}%`];
        });

        const csvContent = [headers.map(sanitizeCSVCell).join(';'), ...rows.map(row => row.map(sanitizeCSVCell).join(';'))].join('\n');
        downloadCSV(csvContent, `Asistencia_${selectedClass.name.replace(/\s+/g, '_')}.csv`);
    };

    const handleExportGlobal = () => {
        if (attendanceRecords.length === 0) {
            alert("No hay registros de asistencia en el sistema.");
            return;
        }

        const headers = ['Fecha', 'Clase', 'Alumno', 'Asistencia', 'Estado Alumno', 'Notas Sesión'];
        const rows: string[][] = [];

        const sortedRecords = [...attendanceRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        sortedRecords.forEach(record => {
            const classObj = classes.find(c => c.id === record.classId);
            if (!classObj) return;

            const enrolledInClass = students.filter(s => s.enrolledClassIds.includes(record.classId));
            const allRelevantStudentIds = new Set([
                ...enrolledInClass.map(s => s.id),
                ...record.presentStudentIds
            ]);

            allRelevantStudentIds.forEach(studentId => {
                const student = students.find(s => s.id === studentId);
                const studentName = student ? student.name : 'Alumno Eliminado';
                const studentStatus = student ? (student.active ? 'Activo' : 'Inactivo') : 'Eliminado';
                const isPresent = record.presentStudentIds.includes(studentId);

                rows.push([
                    new Date(record.date).toLocaleDateString('es-ES'),
                    classObj.name,
                    studentName,
                    isPresent ? 'Presente' : 'Ausente',
                    studentStatus,
                    record.notes || ''
                ]);
            });
        });

        const csvContent = [
            headers.map(sanitizeCSVCell).join(';'),
            ...rows.map(row => row.map(sanitizeCSVCell).join(';'))
        ].join('\n');

        downloadCSV(csvContent, `Asistencia_GLOBAL_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const totalEnrolled = enrolledStudents.length;
    const totalPresent = presentStudentIds.size;

    // --- ABSENCE TRACKING LOGIC ---
    const absenteeAlerts = useMemo(() => {
        return students
            .filter(s => s.active)
            .map(student => {
                // Get all attendance records for ANY class the student is enrolled in
                const relevantRecords = attendanceRecords
                    .filter(r => student.enrolledClassIds.includes(r.classId))
                    .sort((a, b) => b.date.localeCompare(a.date)); // Descending by date

                let consecutiveAbsences = 0;
                for (const record of relevantRecords) {
                    if (!record.presentStudentIds.includes(student.id)) {
                        consecutiveAbsences++;
                    } else {
                        break; // Streak broken by presence
                    }
                }

                return {
                    student,
                    count: consecutiveAbsences,
                    lastDate: relevantRecords.length > 0 ? relevantRecords[0].date : null
                };
            })
            .filter(alert => alert.count > 3)
            .sort((a, b) => b.count - a.count);
    }, [students, attendanceRecords]);

    return (
        <div className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-white">Control de Asistencia</h2>

                <div className="flex gap-2">
                    {selectedClassId && (
                        <button
                            onClick={handleExportSpecificClass}
                            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md flex items-center transition-colors shadow-sm text-sm"
                            title="Exportar matriz de la clase seleccionada"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Exportar Clase
                        </button>
                    )}
                    <button
                        onClick={handleExportGlobal}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors shadow-sm text-sm"
                        title="Exportar listado completo de todas las clases y fechas"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exportar Global
                    </button>
                </div>
            </div>

            {/* ALERTS SECTION (Above Controls) */}
            {absenteeAlerts.length > 0 && (
                <div className="mb-8 bg-red-900/20 border border-red-500/30 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-red-500/20 px-6 py-3 border-b border-red-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="text-red-400 font-bold uppercase tracking-wider text-sm">Alertas de Absentismo</h3>
                        </div>
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Acción Requerida</span>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {absenteeAlerts.map(({ student, count, lastDate }) => (
                            <div key={student.id} className="bg-gray-800/40 p-3 rounded-lg border border-red-500/10 flex items-center justify-between group hover:bg-gray-800/60 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold border border-red-500/20">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-sm leading-tight">{student.name}</p>
                                        <p className="text-red-400/80 text-[10px] uppercase font-bold mt-0.5">
                                            {count} faltas seguidas
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 uppercase">Última clase</p>
                                    <p className="text-[11px] text-gray-300 font-mono">{lastDate ? new Date(lastDate).toLocaleDateString('es-ES') : 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONTROLS */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Fecha</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-2 font-medium uppercase tracking-wider">Hoy es {selectedDayName}</p>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-300">Clase</label>
                            <label className="flex items-center text-xs text-gray-400 cursor-pointer hover:text-gray-200 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={showAllClasses}
                                    onChange={(e) => setShowAllClasses(e.target.checked)}
                                    className="mr-2 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                                />
                                Mostrar todas las de la semana
                            </label>
                        </div>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                            <option value="">-- {sortedClassesList.length > 0 ? 'Seleccionar Clase' : 'No hay clases este día'} --</option>
                            {sortedClassesList.map(c => (
                                <option key={c.id} value={c.id}>
                                    [{c.days.join('/')}] {c.startTime} - {c.name}
                                </option>
                            ))}
                        </select>
                        {!showAllClasses && sortedClassesList.length === 0 && (
                            <p className="text-xs text-orange-400 mt-2 italic">Pulsa "Mostrar todas" si la clase no es de hoy.</p>
                        )}
                    </div>
                </div>
            </div>

            {selectedClassId ? (
                <div className="space-y-6">
                    {/* STATS BAR */}
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                            <div className="text-center">
                                <span className="block text-xs text-gray-400 uppercase">Inscritos</span>
                                <span className="text-xl font-bold text-white">{totalEnrolled}</span>
                            </div>
                            <div className="h-8 w-px bg-gray-600"></div>
                            <div className="text-center">
                                <span className="block text-xs text-gray-400 uppercase">Presentes</span>
                                <span className="text-xl font-bold text-green-400">{totalPresent}</span>
                            </div>
                            <div className="h-8 w-px bg-gray-600"></div>
                            <div className="text-center">
                                <span className="block text-xs text-gray-400 uppercase">Ausentes</span>
                                <span className="text-xl font-bold text-red-400">{totalEnrolled - totalPresent}</span>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button onClick={handleMarkAll} className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors">
                                Marcar Todos
                            </button>
                            <button onClick={handleClearAll} className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors">
                                Desmarcar Todos
                            </button>
                        </div>
                    </div>

                    {/* STUDENTS LIST */}
                    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                        {enrolledStudents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                {enrolledStudents.map(student => {
                                    const isPresent = presentStudentIds.has(student.id);
                                    return (
                                        <div
                                            key={student.id}
                                            onClick={() => handleToggleStudent(student.id)}
                                            className={`
                                                cursor-pointer rounded-lg p-4 flex items-center justify-between border-2 transition-all duration-200
                                                ${isPresent
                                                    ? 'bg-green-900/20 border-green-500/50 hover:bg-green-900/30'
                                                    : 'bg-gray-700/30 border-transparent hover:bg-gray-700/50 hover:border-gray-500'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isPresent ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <span className={`font-medium ${isPresent ? 'text-white' : 'text-gray-400'}`}>
                                                    {student.name}
                                                </span>
                                            </div>
                                            {isPresent && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <p className="text-gray-500 text-lg">No hay alumnos inscritos en esta clase.</p>
                            </div>
                        )}
                    </div>

                    {/* NOTES & SAVE */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Notas de la sesión (Opcional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ej: Coreografía avanzada, faltó calentar bien, etc."
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                        ></textarea>

                        <div className="flex items-center justify-end space-x-4">
                            {showSuccess && (
                                <span className="text-green-400 font-medium animate-pulse">
                                    ¡Asistencia guardada correctamente!
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition hover:scale-105"
                            >
                                Guardar Asistencia
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-800/50 border border-gray-700 border-dashed rounded-xl p-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-xl text-gray-400 font-medium">Selecciona una clase para comenzar a pasar lista.</p>
                </div>
            )}
        </div>
    );
};

export default Attendance;
