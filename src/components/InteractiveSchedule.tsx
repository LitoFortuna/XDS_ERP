
import React, { useState, useRef, useEffect } from 'react';
import { DanceClass, Instructor, Student, DayOfWeek } from '../../types';
import Modal from './Modal';
import { ClassForm } from './ClassSchedule';
import PageHeader from './ui/PageHeader';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DAY_SHORT: Record<string, string> = { Lunes: 'Lun', Martes: 'Mar', Miércoles: 'Mié', Jueves: 'Jue', Viernes: 'Vie', Sábado: 'Sáb' };
const CATEGORY_BAR: Record<string, string> = {
    'Fitness': 'border-emerald-400',
    'Baile Moderno': 'border-purple-400',
    'Competición': 'border-rose-400',
    'Especializada': 'border-blue-400',
};

// ¿Pantalla de móvil? (misma frontera que el `md` de Tailwind). Se usa para elegir la vista:
// la cuadrícula semanal de 1000 px obliga a deslizar de lado y solo deja ver dos días a la vez.
const useIsMobile = () => {
    const query = '(max-width: 767px)';
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
    useEffect(() => {
        const mql = window.matchMedia(query);
        const onChange = () => setIsMobile(mql.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);
    return isMobile;
};

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
    const isMobile = useIsMobile();
    // En móvil se puede elegir entre la lista por día (por defecto) y la cuadrícula completa; el
    // PDF solo existe en la cuadrícula porque es lo que se captura.
    const [mobileView, setMobileView] = useState<'list' | 'grid'>('list');
    const showGrid = !isMobile || mobileView === 'grid';
    const todayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>((todayName === 'Domingo' ? 'Lunes' : todayName) as DayOfWeek);

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
                backgroundColor: '#0f172a',
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
    
    // Eliminado el Domingo
    const daysOfWeek: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const timeToMinutes = (time: string) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    const getGridPosition = (danceClass: DanceClass) => {
        const calculateRow = (time: string) => {
            let minutes = timeToMinutes(time);
            // Salto de 13:00 a 15:00 para ahorrar espacio vertical masivamente
            if (minutes >= timeToMinutes('15:00')) {
                minutes -= 120;
            }
            // Redondeado a la fila de 15 min más cercana: una clase cuya hora no cae justo en un
            // múltiplo de 15 (p.ej. termina a las 21:35, en vez de :30 o :45) generaría un número
            // de fila con decimales, que CSS Grid considera inválido — el navegador ignora el
            // grid-row entero y la clase salta al principio de la cuadrícula en vez de mostrarse
            // en su horario real.
            return Math.round((minutes - timeToMinutes('08:00')) / 15) + 1;
        };

        const rowStart = calculateRow(danceClass.startTime);
        // Tras redondear, una clase muy corta (<8 min) podría quedar con la misma fila de inicio
        // y fin — un tramo de 0 filas también es inválido en CSS Grid, así que se garantiza al
        // menos 1 fila de alto.
        const rowEnd = Math.max(calculateRow(danceClass.endTime), rowStart + 1);

        return {
            gridRow: `${rowStart} / ${rowEnd}`,
        };
    };

    const getClassStyle = (category: string) => {
        switch (category) {
            case 'Fitness':
                return 'bg-emerald-600/90 border-l-4 border-emerald-400 text-emerald-50';
            case 'Baile Moderno':
                return 'bg-purple-600/90 border-l-4 border-purple-400 text-purple-50';
            case 'Competición':
                return 'bg-rose-600/90 border-l-4 border-rose-400 text-rose-50';
            case 'Especializada':
                return 'bg-blue-600/90 border-l-4 border-blue-400 text-blue-50';
            default:
                return 'bg-gray-600/90 border-l-4 border-gray-400 text-gray-100';
        }
    };

    // 52 slots de 15 min (8:00-13:00 y 15:00-23:00). Antes llegaba solo hasta las 22:00 en punto
    // y "Salsa" (Miércoles 21:35-22:30) se salía del rango explícito de la cuadrícula.
    const totalRows = 52;
    const rowHeight = '20px'; // Compactado para máxima visibilidad

    return (
        <div className="p-2 sm:p-6 flex flex-col min-h-full">
            <PageHeader
                className="px-2 !mb-4"
                title="Horario Semanal"
                actions={
                    <>
                        <div className="hidden xl:flex gap-3 text-[9px] font-black uppercase tracking-tighter">
                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-emerald-500 mr-1.5"></span>Fitness</span>
                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-purple-500 mr-1.5"></span>Moderno</span>
                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-rose-500 mr-1.5"></span>Compe</span>
                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-blue-500 mr-1.5"></span>Especial</span>
                        </div>

                        {isMobile && (
                            <div role="tablist" aria-label="Vista del horario" className="inline-flex p-0.5 rounded-full bg-gray-800 border border-gray-700 justify-self-start">
                                {(['list', 'grid'] as const).map(v => (
                                    <button
                                        key={v}
                                        role="tab"
                                        aria-selected={mobileView === v}
                                        onClick={() => setMobileView(v)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold ${mobileView === v ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                                    >
                                        {v === 'list' ? 'Por día' : 'Semana'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {showGrid && (
                            <button onClick={exportToPDF} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 md:py-2 rounded-lg flex items-center justify-center transition-all border border-gray-700 font-bold text-xs uppercase tracking-widest">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                PDF
                            </button>
                        )}
                    </>
                }
            />

            {/* Móvil (vista "Por día"): selector de día y lista de clases ordenadas por hora. */}
            {isMobile && mobileView === 'list' && (
                <div className="px-2">
                    <div role="tablist" aria-label="Día de la semana" className="grid grid-cols-6 gap-1 mb-4">
                        {daysOfWeek.map(day => {
                            const count = classes.filter(c => c.days.includes(day)).length;
                            const isSelected = selectedDay === day;
                            return (
                                <button
                                    key={day}
                                    role="tab"
                                    aria-selected={isSelected}
                                    onClick={() => setSelectedDay(day)}
                                    className={`min-h-[52px] rounded-lg border flex flex-col items-center justify-center ${isSelected ? 'bg-purple-600 border-purple-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                                >
                                    <span className="text-sm font-bold">{DAY_SHORT[day]}</span>
                                    <span className={`text-[11px] ${isSelected ? 'text-purple-100' : 'text-gray-500'}`}>{count} {count === 1 ? 'clase' : 'clases'}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="space-y-2">
                        {classes
                            .filter(c => c.days.includes(selectedDay))
                            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
                            .map(c => {
                                const enrolledCount = students.filter(s => s.enrolledClassIds.includes(c.id)).length;
                                const instructorName = instructors.find(i => i.id === c.instructorId)?.name;
                                const isFull = c.capacity > 0 && enrolledCount >= c.capacity;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => handleOpenModal(c)}
                                        className={`w-full text-left bg-gray-800 ring-1 ring-inset ring-gray-700 border-l-4 ${CATEGORY_BAR[c.category] || 'border-gray-400'} rounded-xl p-3 flex items-center gap-3 min-h-[68px]`}
                                    >
                                        <div className="w-14 flex-shrink-0 text-center">
                                            <p className="text-base font-bold text-white leading-none">{c.startTime}</p>
                                            <p className="text-[11px] text-gray-400 mt-1">{c.endTime}</p>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-white truncate">{c.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{instructorName ? `${instructorName} · ` : ''}{c.category}</p>
                                        </div>
                                        <span className={`flex-shrink-0 text-sm font-semibold ${isFull ? 'text-amber-300' : 'text-gray-200'}`}>
                                            {enrolledCount}/{c.capacity}
                                            {isFull && <span className="block text-[10px] font-bold uppercase">Completa</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        {classes.filter(c => c.days.includes(selectedDay)).length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-10 border border-dashed border-gray-700 rounded-xl">No hay clases los {selectedDay.toLowerCase()}{/^(sábado|domingo)$/i.test(selectedDay) ? 's' : ''}.</p>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-5 text-[11px] font-semibold text-gray-400">
                        <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-emerald-500 mr-1.5"></span>Fitness</span>
                        <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-purple-500 mr-1.5"></span>Baile moderno</span>
                        <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-rose-500 mr-1.5"></span>Competición</span>
                        <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-blue-500 mr-1.5"></span>Especializada</span>
                    </div>
                </div>
            )}

            {showGrid && (
            <div ref={scheduleRef} className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-visible">
                <div className="overflow-x-auto custom-scrollbar">
                    <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '60px repeat(6, 1fr)', 
                            gridTemplateRows: `40px repeat(${totalRows}, ${rowHeight})` 
                        }} 
                        className="relative min-w-[1000px] p-2 bg-[#0f172a]"
                    >
                        {/* Etiquetas de Tiempo */}
                        {Array.from({ length: 16 }, (_, i) => i + 8)
                            .filter(hour => hour < 13 || hour >= 15)
                            .map((hour, idx) => {
                                const row = idx * 4 + 2;
                                return (
                                    <div key={hour} style={{ gridRow: row, gridColumn: 1 }} className="text-[10px] font-black text-right pr-3 text-gray-600 -mt-2 relative uppercase">
                                        {hour}:00
                                        <span className="absolute right-0 top-2 w-1.5 h-px bg-gray-800"></span>
                                    </div>
                                );
                        })}
                        
                        {/* Cabeceras de Días */}
                        {daysOfWeek.map((day, index) => (
                            <div key={day} style={{ gridColumn: index + 2, gridRow: 1 }} className="text-center font-black text-gray-500 py-3 border-b border-gray-800 bg-[#0f172a] sticky top-0 z-20 uppercase tracking-widest text-[10px]">
                                {day}
                            </div>
                        ))}
                        
                        {/* Líneas de Cuadrícula Verticales */}
                        {daysOfWeek.map((day, dayIndex) => (
                             <div key={`col-${day}`} style={{ gridColumn: dayIndex + 2, gridRow: '2 / -1' }} className="border-l border-gray-800/20 bg-gray-800/5 pointer-events-none"></div>
                        ))}
                        
                        {/* Líneas de Cuadrícula Horizontales (Horas) */}
                         {Array.from({ length: totalRows / 4 }, (_, i) => i).map(hourIdx => (
                            <div key={`row-div-${hourIdx}`} style={{ gridRow: (hourIdx * 4) + 2, gridColumn: '2 / -1' }} className="border-t border-gray-800/60 pointer-events-none w-full h-px absolute"></div>
                        ))}

                        {/* Renderizado de Clases */}
                        {daysOfWeek.map((day, dayIndex) => (
                            <div key={day} style={{ gridColumn: dayIndex + 2, gridRow: '2 / -1', display: 'grid', gridTemplateRows: `repeat(${totalRows}, ${rowHeight})` }} className="relative z-10 mx-0.5">
                                {classes
                                    .filter(c => c.days.includes(day))
                                    .map(c => {
                                        const enrolledCount = students.filter(s => s.enrolledClassIds.includes(c.id)).length;
                                        const duration = timeToMinutes(c.endTime) - timeToMinutes(c.startTime);
                                        const isVeryShort = duration <= 30;
                                        
                                        return (
                                            <div
                                                key={c.id}
                                                style={getGridPosition(c)}
                                                className={`
                                                    ${getClassStyle(c.category)}
                                                    rounded-lg shadow-md m-[1px] overflow-hidden flex flex-col justify-center 
                                                    cursor-pointer transition-all duration-200 
                                                    hover:scale-[1.02] hover:shadow-xl hover:z-50 hover:brightness-110
                                                    px-2 py-1
                                                `}
                                                onClick={() => handleOpenModal(c)}
                                            >
                                                <span className={`font-black leading-none truncate uppercase tracking-tighter mb-0.5 ${isVeryShort ? 'text-[8px]' : 'text-[10px]'}`}>{c.name}</span>
                                                
                                                {!isVeryShort && (
                                                    <div className="flex items-center justify-between text-[8px] font-bold opacity-90 mt-0.5">
                                                        <span className="truncate">{c.startTime}</span>
                                                        <span className="flex items-center shrink-0 ml-1">
                                                            <svg className="w-2 h-2 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" /></svg>
                                                            {enrolledCount}/{c.capacity}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {duration >= 60 && (
                                                    <div className="mt-0.5 text-[7px] font-bold uppercase opacity-70 truncate border-t border-white/10 pt-0.5">
                                                        {instructors.find(i => i.id === c.instructorId)?.name.split(' ')[0]}
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
            )}

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
