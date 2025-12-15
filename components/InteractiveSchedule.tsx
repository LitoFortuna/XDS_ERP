
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
            // Use canvas dimensions for PDF to maintain aspect ratio
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
    
    // Added 'Sábado' to the list
    const daysOfWeek: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const timeToMinutes = (time: string) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    const getGridPosition = (danceClass: DanceClass) => {
        const calculateRow = (time: string) => {
            let minutes = timeToMinutes(time);
            // Anything from 15:00 onwards is shifted up by 2 hours (120 minutes)
            if (minutes >= timeToMinutes('15:00')) {
                minutes -= 120;
            }
            // The row is relative to the inner grid which starts at row 1.
            return (minutes - timeToMinutes('08:00')) / 15 + 1;
        };

        const rowStart = calculateRow(danceClass.startTime);
        const rowEnd = calculateRow(danceClass.endTime);

        return {
            gridRow: `${rowStart} / ${rowEnd}`,
        };
    };

    // Helper function to determine color based on category
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

    // Calculate total rows, excluding 13:00-15:00 (2 hours * 4 slots/hour = 8 slots)
    // 08:00 to 22:00 is 14 hours. Minus 2 hours break = 12 hours.
    // 12 hours * 4 slots = 48 slots.
    const totalRows = 48; 

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Horario Semanal</h2>
                    <p className="text-sm text-gray-400 mt-1">Vista interactiva de clases y ocupación</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Legend */}
                    <div className="hidden lg:flex gap-3 text-xs mr-4">
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>Fitness</span>
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-purple-500 mr-1"></span>Moderno</span>
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-rose-500 mr-1"></span>Compe</span>
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>Especial</span>
                    </div>

                    <button onClick={exportToPDF} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center transition-colors shadow-sm text-sm border border-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        PDF
                    </button>
                </div>
            </div>

            <div ref={scheduleRef} className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex-grow flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-grow">
                    <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '60px repeat(6, 1fr)', // Changed to 6 columns
                            gridTemplateRows: `50px repeat(${totalRows}, 15px)` // Taller header, fixed row height
                        }} 
                        className="relative min-w-[900px] p-4 bg-gray-900"
                    >
                        {/* Time labels (hourly), skipping 13h and 14h */}
                        {Array.from({ length: 15 }, (_, i) => i + 8)
                            .filter(hour => hour < 13 || hour >= 15)
                            .map((hour, idx) => {
                                // Calculate grid row for the label. 
                                // Each hour is 4 slots.
                                const row = idx * 4 + 2;
                                return (
                                    <div key={hour} style={{ gridRow: row, gridColumn: 1 }} className="text-xs font-mono text-right pr-3 text-gray-500 -mt-2.5 relative">
                                        {hour}:00
                                        <span className="absolute right-0 top-2.5 w-1.5 h-px bg-gray-700"></span>
                                    </div>
                                );
                        })}
                        
                        {/* Day labels Header */}
                        {daysOfWeek.map((day, index) => (
                            <div key={day} style={{ gridColumn: index + 2, gridRow: 1 }} className="text-center font-bold text-gray-300 py-3 border-b border-gray-700 bg-gray-900/90 backdrop-blur-sm sticky top-0 z-20">
                                {day}
                            </div>
                        ))}
                        
                        {/* Vertical Grid lines (Column dividers) */}
                        {daysOfWeek.map((day, dayIndex) => (
                             <div key={`col-${day}`} style={{ gridColumn: dayIndex + 2, gridRow: '2 / -1' }} className="border-l border-gray-800/50 bg-gray-800/10 pointer-events-none"></div>
                        ))}
                        
                        {/* Horizontal Grid lines (Hour dividers) */}
                         {Array.from({ length: totalRows / 4 }, (_, i) => i).map(hourIdx => (
                            <div key={`row-div-${hourIdx}`} style={{ gridRow: (hourIdx * 4) + 2, gridColumn: '2 / -1' }} className="border-t border-gray-700/50 pointer-events-none w-full h-px absolute"></div>
                        ))}
                        
                        {/* Horizontal Sub-Grid lines (15 min dividers) - fainter */}
                        {Array.from({ length: totalRows }, (_, i) => i + 2).map(rowIndex => (
                            <div key={`row-sub-${rowIndex}`} style={{ gridRow: rowIndex, gridColumn: '2 / -1' }} className={`border-t border-gray-800/30 w-full h-px absolute pointer-events-none ${ (rowIndex - 2) % 4 === 0 ? 'hidden' : '' }`}></div>
                        ))}

                        {/* Classes */}
                        {daysOfWeek.map((day, dayIndex) => (
                            <div key={day} style={{ gridColumn: dayIndex + 2, gridRow: '2 / -1', display: 'grid', gridTemplateRows: `repeat(${totalRows}, 15px)` }} className="relative z-10 mx-1">
                                {classes
                                    .filter(c => c.days.includes(day))
                                    .map(c => {
                                        const enrolledCount = students.filter(s => s.enrolledClassIds.includes(c.id)).length;
                                        const duration = timeToMinutes(c.endTime) - timeToMinutes(c.startTime);
                                        const isShortClass = duration < 60;
                                        
                                        return (
                                            <div
                                                key={c.id}
                                                style={getGridPosition(c)}
                                                className={`
                                                    ${getClassStyle(c.category)}
                                                    rounded-md shadow-md m-[1px] overflow-hidden flex flex-col justify-center 
                                                    cursor-pointer transition-all duration-200 
                                                    hover:scale-[1.02] hover:shadow-xl hover:z-50 hover:brightness-110
                                                    ${isShortClass ? 'px-2' : 'p-2'}
                                                `}
                                                onClick={() => handleOpenModal(c)}
                                                title={`${c.name} - ${c.startTime} a ${c.endTime} (${enrolledCount}/${c.capacity})`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className={`font-bold leading-tight truncate ${isShortClass ? 'text-[10px]' : 'text-xs'}`}>{c.name}</span>
                                                    {!isShortClass && (
                                                        <span className="text-[10px] opacity-80 bg-black/20 px-1.5 rounded ml-1 whitespace-nowrap">
                                                            {enrolledCount}/{c.capacity}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {!isShortClass && (
                                                    <div className="mt-1 flex items-center justify-between text-[10px] opacity-90">
                                                        <span>{c.startTime}</span>
                                                        {instructors.find(i => i.id === c.instructorId) && (
                                                            <span className="truncate max-w-[60px] text-right">
                                                                {instructors.find(i => i.id === c.instructorId)?.name.split(' ')[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {isShortClass && (
                                                     <div className="flex justify-between items-center mt-0.5">
                                                        <span className="text-[9px] opacity-80">{c.startTime}</span>
                                                        <span className="text-[9px] font-mono bg-black/20 px-1 rounded">{enrolledCount}</span>
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
