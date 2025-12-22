
import React, { useState, useRef } from 'react';
import { DanceClass, Instructor, Student, DayOfWeek } from '../types';
import Modal from './Modal';
import { ClassForm } from './ClassSchedule';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InteractiveScheduleProps {
  classes: DanceClass[];
  instructors: Instructor[];
  students: Student[];
  updateClass: (danceClass: DanceClass) => void;
}

const InteractiveSchedule: React.FC<InteractiveScheduleProps> = ({ classes, instructors, students, updateClass }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<DanceClass | undefined>(undefined);
    const scheduleRef = useRef<HTMLDivElement>(null);

    const handleOpenModal = (danceClass: DanceClass) => {
        setEditingClass(danceClass);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingClass(undefined);
        setIsModalOpen(false);
    };

    const handleSubmit = (danceClass: Omit<DanceClass, 'id'> | DanceClass) => {
        if ('id' in danceClass) {
            updateClass(danceClass);
        }
        handleCloseModal();
    };

    const exportToPDF = async () => {
        const scheduleElement = scheduleRef.current;
        if (!scheduleElement) return;

        try {
            const canvas = await html2canvas(scheduleElement, {
                scale: 2,
                backgroundColor: '#111827', // Match bg-gray-900
                width: scheduleElement.scrollWidth,
                height: scheduleElement.scrollHeight
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'l' : 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save("horario-xen-dance-space.pdf");
        } catch (error) {
            console.error("Error exporting to PDF", error);
        }
    };
    
    // Extendido a toda la semana incluyendo Domingo
    const daysOfWeek: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const timeToMinutes = (time: string) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    const getGridPosition = (danceClass: DanceClass) => {
        const calculateRow = (time: string) => {
            let minutes = timeToMinutes(time);
            // Salto de 13:00 a 15:00
            if (minutes >= timeToMinutes('15:00')) {
                minutes -= 120;
            }
            return (minutes - timeToMinutes('08:00')) / 15 + 1;
        };

        const rowStart = calculateRow(danceClass.startTime);
        const rowEnd = calculateRow(danceClass.endTime);

        return {
            gridRow: `${rowStart} / ${rowEnd}`,
        };
    };

    const getClassStyle = (category: string) => {
        switch (category) {
            case 'Fitness':
                return 'bg-gradient-to-br from-emerald-600 to-teal-700 border-l-4 border-emerald-400 text-emerald-50';
            case 'Baile Moderno':
                return 'bg-gradient-to-br from-purple-600 to-indigo-700 border-l-4 border-purple-400 text-purple-50';
            case 'Competición':
                return 'bg-gradient-to-br from-rose-600 to-orange-700 border-l-4 border-rose-400 text-rose-50';
            case 'Especializada':
                return 'bg-gradient-to-br from-blue-600 to-cyan-700 border-l-4 border-blue-400 text-blue-50';
            default:
                return 'bg-gradient-to-br from-gray-600 to-gray-700 border-l-4 border-gray-400 text-gray-100';
        }
    };

    // 48 slots de 15 min (12 horas efectivas)
    const totalRows = 48; 
    const rowHeight = '25px'; // Aumentado para extender visualmente el horario

    return (
        <div className="p-4 sm:p-8 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Horario Semanal</h2>
                    <p className="text-sm text-gray-400 mt-1 uppercase font-bold tracking-widest opacity-60">Planificación de clases y ocupación</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex gap-4 text-[10px] font-black uppercase tracking-tighter mr-4">
                        <span className="flex items-center"><span className="w-3 h-3 rounded bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>Fitness</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded bg-purple-500 mr-2 shadow-[0_0_8px_rgba(139,92,246,0.4)]"></span>Moderno</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded bg-rose-500 mr-2 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span>Compe</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>Especial</span>
                    </div>

                    <button onClick={exportToPDF} className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl flex items-center transition-all shadow-lg border border-gray-700 font-bold text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Descargar PDF
                    </button>
                </div>
            </div>

            <div ref={scheduleRef} className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-visible">
                <div className="overflow-x-auto custom-scrollbar">
                    <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '70px repeat(7, 1fr)', 
                            gridTemplateRows: `60px repeat(${totalRows}, ${rowHeight})` 
                        }} 
                        className="relative min-w-[1100px] p-6 bg-[#0f172a]"
                    >
                        {/* Etiquetas de Tiempo */}
                        {Array.from({ length: 15 }, (_, i) => i + 8)
                            .filter(hour => hour < 13 || hour >= 15)
                            .map((hour, idx) => {
                                const row = idx * 4 + 2;
                                return (
                                    <div key={hour} style={{ gridRow: row, gridColumn: 1 }} className="text-[11px] font-black text-right pr-4 text-gray-600 -mt-2.5 relative uppercase tracking-tighter">
                                        {hour}:00
                                        <span className="absolute right-0 top-2.5 w-2 h-px bg-gray-800"></span>
                                    </div>
                                );
                        })}
                        
                        {/* Cabeceras de Días */}
                        {daysOfWeek.map((day, index) => (
                            <div key={day} style={{ gridColumn: index + 2, gridRow: 1 }} className="text-center font-black text-gray-400 py-4 border-b border-gray-800 bg-[#0f172a] sticky top-0 z-20 uppercase tracking-[0.2em] text-xs">
                                {day}
                            </div>
                        ))}
                        
                        {/* Líneas de Cuadrícula Verticales */}
                        {daysOfWeek.map((day, dayIndex) => (
                             <div key={`col-${day}`} style={{ gridColumn: dayIndex + 2, gridRow: '2 / -1' }} className="border-l border-gray-800/30 bg-gray-800/5 pointer-events-none"></div>
                        ))}
                        
                        {/* Líneas de Cuadrícula Horizontales (Horas) */}
                         {Array.from({ length: totalRows / 4 }, (_, i) => i).map(hourIdx => (
                            <div key={`row-div-${hourIdx}`} style={{ gridRow: (hourIdx * 4) + 2, gridColumn: '2 / -1' }} className="border-t border-gray-800 pointer-events-none w-full h-px absolute"></div>
                        ))}
                        
                        {/* Líneas de Cuadrícula Horizontales (15 min) */}
                        {Array.from({ length: totalRows }, (_, i) => i + 2).map(rowIndex => (
                            <div key={`row-sub-${rowIndex}`} style={{ gridRow: rowIndex, gridColumn: '2 / -1' }} className={`border-t border-gray-800/20 w-full h-px absolute pointer-events-none ${ (rowIndex - 2) % 4 === 0 ? 'hidden' : '' }`}></div>
                        ))}

                        {/* Renderizado de Clases */}
                        {daysOfWeek.map((day, dayIndex) => (
                            <div key={day} style={{ gridColumn: dayIndex + 2, gridRow: '2 / -1', display: 'grid', gridTemplateRows: `repeat(${totalRows}, ${rowHeight})` }} className="relative z-10 mx-1.5">
                                {classes
                                    .filter(c => c.days.includes(day))
                                    .map(c => {
                                        const enrolledCount = students.filter(s => s.enrolledClassIds.includes(c.id)).length;
                                        const duration = timeToMinutes(c.endTime) - timeToMinutes(c.startTime);
                                        const isShortClass = duration < 50;
                                        
                                        return (
                                            <div
                                                key={c.id}
                                                style={getGridPosition(c)}
                                                className={`
                                                    ${getClassStyle(c.category)}
                                                    rounded-xl shadow-lg m-[2px] overflow-hidden flex flex-col justify-center 
                                                    cursor-pointer transition-all duration-300 
                                                    hover:scale-[1.03] hover:shadow-2xl hover:z-50 hover:brightness-110
                                                    ${isShortClass ? 'px-3' : 'p-3'}
                                                `}
                                                onClick={() => handleOpenModal(c)}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`font-black leading-tight truncate uppercase tracking-tighter ${isShortClass ? 'text-[10px]' : 'text-[11px]'}`}>{c.name}</span>
                                                </div>
                                                
                                                {!isShortClass && (
                                                    <>
                                                        <div className="flex items-center justify-between text-[10px] font-bold opacity-80 mt-auto">
                                                            <span className="bg-black/20 px-2 py-0.5 rounded-full">{c.startTime} - {c.endTime}</span>
                                                            <span className="flex items-center">
                                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" /></svg>
                                                                {enrolledCount}/{c.capacity}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 text-[9px] font-black uppercase opacity-60 truncate">
                                                            {instructors.find(i => i.id === c.instructorId)?.name}
                                                        </div>
                                                    </>
                                                )}
                                                
                                                {isShortClass && (
                                                     <div className="flex justify-between items-center text-[9px] font-black opacity-80">
                                                        <span>{c.startTime}</span>
                                                        <span className="bg-black/20 px-1.5 rounded">{enrolledCount}/{c.capacity}</span>
                                                     </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Editar Clase">
                {editingClass && (
                <ClassForm
                    danceClass={editingClass}
                    instructors={instructors}
                    students={students}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                />
                )}
            </Modal>
        </div>
    );
};

export default InteractiveSchedule;
