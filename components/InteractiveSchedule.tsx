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

// Fix: Reconstructed the entire InteractiveSchedule component to fix syntax and reference errors.
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
                backgroundColor: '#1f2937', // Match the background color for export
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
    
    const daysOfWeek: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    const timeToMinutes = (time: string) => {
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

    // Calculate total rows, excluding 13:00-15:00 (2 hours * 4 slots/hour = 8 slots)
    const totalRows = (22 - 8 - 2) * 4;

    return (
        <div className="p-4 sm:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Horario Interactivo</h2>
                <button onClick={exportToPDF} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Exportar a PDF
                </button>
            </div>
            <div ref={scheduleRef} className="bg-gray-800 p-4 rounded-lg shadow-sm overflow-x-auto">
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gridTemplateRows: `40px repeat(${totalRows}, 16px)` }} className="relative min-w-[700px]">
                    {/* Time labels (hourly), skipping 13h and 14h */}
                    {Array.from({ length: 15 }, (_, i) => i + 8)
                        .filter(hour => hour < 13 || hour >= 15)
                        .map(hour => {
                            const row = ((hour - 8) - (hour >= 15 ? 2 : 0)) * 4 + 2;
                            return (
                                <div key={hour} style={{ gridRow: row, gridColumn: 1 }} className="text-xs text-right pr-2 text-gray-400 -mt-2">
                                    {hour}:00
                                </div>
                            );
                    })}
                    
                    {/* Day labels */}
                    {daysOfWeek.map((day, index) => (
                        <div key={day} style={{ gridColumn: index + 2, gridRow: 1 }} className="text-center font-bold text-white p-2 border-b border-l border-gray-700">
                            {day}
                        </div>
                    ))}
                    
                    {/* Grid lines */}
                    {daysOfWeek.map((day, dayIndex) => (
                         <div key={`col-${day}`} style={{ gridColumn: dayIndex + 2, gridRow: '2 / -1' }} className="border-l border-gray-700"></div>
                    ))}
                     {Array.from({ length: totalRows + 1 }, (_, i) => i + 1).map(rowIndex => (
                        <div key={`row-${rowIndex}`} style={{ gridRow: rowIndex, gridColumn: '1 / -1' }} className={`border-t border-gray-700 ${ (rowIndex - 1) % 4 === 0 ? '' : 'opacity-50' }`}></div>
                    ))}

                    {/* Classes */}
                    {daysOfWeek.map((day, dayIndex) => (
                        <div key={day} style={{ gridColumn: dayIndex + 2, gridRow: '2 / -1', display: 'grid', gridTemplateRows: `repeat(${totalRows}, 16px)` }} className="relative">
                            {classes
                                .filter(c => c.days.includes(day))
                                .map(c => {
                                    const enrolledCount = students.filter(s => s.enrolledClassIds.includes(c.id)).length;
                                    return (
                                        <div
                                            key={c.id}
                                            style={getGridPosition(c)}
                                            className="bg-purple-200 border border-purple-400 rounded-md p-1 m-px overflow-hidden flex flex-col justify-center cursor-pointer hover:bg-purple-300 transition-colors"
                                            onClick={() => handleOpenModal(c)}
                                        >
                                            <span className="font-semibold text-[10px] text-purple-900 truncate" title={c.name}>{c.name}</span>
                                            <span className="text-[9px] text-purple-700">{c.startTime} - {c.endTime}</span>
                                            <span className="text-[9px] font-bold text-purple-800 mt-1">{`${enrolledCount}/${c.capacity}`}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
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
