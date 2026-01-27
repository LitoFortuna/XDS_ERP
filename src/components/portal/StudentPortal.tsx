
import React, { useEffect, useState } from 'react';
import { Student, Payment, AttendanceRecord, DanceClass, MerchandiseItem, DanceEvent, ChangeRequest } from '../../../types';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { createChangeRequest, getChangeRequestsByStudent } from '../../../services/changeRequestService';

interface StudentPortalProps {
    student: Student;
    onLogout: () => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ student, onLogout }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [classes, setClasses] = useState<DanceClass[]>([]);
    const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
    const [events, setEvents] = useState<DanceEvent[]>([]);
    const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

    useEffect(() => {
        const loadStudentData = async () => {
            try {
                console.log('[StudentPortal] Loading data for student:', student.name, student.id);
                console.log('[StudentPortal] Enrolled class IDs:', student.enrolledClassIds);

                // 1. Cargar Pagos (sin orderBy para evitar índice compuesto)
                const paymentsQ = query(
                    collection(db, 'payments'),
                    where('studentId', '==', student.id)
                );
                const paymentsSnap = await getDocs(paymentsQ);
                const paymentsData = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
                // Filtrar solo pagos del año actual (2026)
                const currentYear = new Date().getFullYear();
                const currentYearPayments = paymentsData.filter(p => new Date(p.date).getFullYear() === currentYear);
                // Ordenar por fecha en el cliente
                currentYearPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                console.log('[StudentPortal] Payments loaded (current year):', currentYearPayments.length, currentYearPayments);
                setPayments(currentYearPayments);

                // 2. Cargar TODAS las Clases de la academia (para mostrar horario completo)
                const classesSnap = await getDocs(collection(db, 'classes'));
                const allClasses = classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as DanceClass));
                console.log('[StudentPortal] All classes loaded:', allClasses.length);
                setClasses(allClasses);

                // 2.5. Cargar Merchandising disponible (stock > 0)
                const merchSnap = await getDocs(collection(db, 'merchandiseItems'));
                const allMerch = merchSnap.docs.map(d => ({ id: d.id, ...d.data() } as MerchandiseItem));
                console.log('[StudentPortal] All merchandise from DB:', allMerch);
                console.log('[StudentPortal] Merchandise count:', allMerch.length);
                allMerch.forEach(item => {
                    console.log(`  - ${item.name}: stock=${item.stock} (type: ${typeof item.stock})`);
                });
                const availableMerch = allMerch.filter(item => item.stock > 0);
                console.log('[StudentPortal] Merchandise loaded (stock > 0):', availableMerch.length, availableMerch);
                setMerchandise(availableMerch);

                // 3. Cargar Asistencia (limitado a últimos 20 registros donde aparezca el estudiante)
                // OJO: Buscar en array 'presentStudentIds' puede requerir un index compuesto o ser lento sin índice.
                // Workaround: Cargar asistencia de las clases del alumno de los últimos 2 meses.
                // Simplificación actual: fetch all attendance records for user's classes and filter in memory (not scalable but works for MVP).
                const enrolledIds = student.enrolledClassIds || [];
                if (enrolledIds.length > 0) {
                    const attQ = query(
                        collection(db, 'attendance'),
                        where('classId', 'in', enrolledIds.slice(0, 10)) // Limit 'in' to 10
                    );
                    const attSnap = await getDocs(attQ);
                    const records = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
                    // Filtrar solo asistencia del año actual (2026)
                    const currentYear = new Date().getFullYear();
                    const currentYearRecords = records.filter(r => new Date(r.date).getFullYear() === currentYear);
                    // Ordenar por fecha en el cliente
                    currentYearRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    // Filter where student was present OR just show the class record? Better show presence.
                    // Let's show all sessions of their classes, and mark if they attended.
                    console.log('[StudentPortal] Attendance records loaded (current year):', currentYearRecords.length);
                    setAttendance(currentYearRecords.slice(0, 50)); // Limitar a 50 registros
                }

                // 4. Cargar Eventos donde el estudiante participa
                const eventsSnap = await getDocs(collection(db, 'events'));
                const allEvents = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DanceEvent));
                // Filtrar eventos donde el estudiante es participante
                const studentEvents = allEvents.filter(event =>
                    event.participants?.some(p => p.studentId === student.id)
                );
                // Ordenar por fecha (próximos primero)
                studentEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                console.log('[StudentPortal] Student events loaded:', studentEvents.length);
                setEvents(studentEvents);

                // 5. Cargar solicitudes de cambio del estudiante
                const requests = await getChangeRequestsByStudent(student.id);
                console.log('[StudentPortal] Change requests loaded:', requests.length);
                setChangeRequests(requests);

            } catch (error) {
                console.error("[StudentPortal] Error loading portal data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadStudentData();
    }, [student]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatTime = (time: string) => {
        return time; // Already in HH:MM format
    };

    // Get upcoming classes for the next 7 days (only enrolled classes)
    const getUpcomingClasses = () => {
        const today = new Date();
        const next7Days: { date: Date; dayName: string; classes: DanceClass[] }[] = [];

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const enrolledIds = student.enrolledClassIds || [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayName = dayNames[date.getDay()];

            // Filtrar solo clases inscritas
            const dayClasses = classes.filter(c => c.days.includes(dayName) && enrolledIds.includes(c.id));

            if (dayClasses.length > 0) {
                next7Days.push({ date, dayName, classes: dayClasses });
            }
        }

        return next7Days;
    };

    // Organize classes by day of week for schedule view
    const getWeeklySchedule = () => {
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const schedule: { [key: string]: DanceClass[] } = {};

        dayNames.forEach(day => {
            schedule[day] = classes.filter(c => c.days.includes(day)).sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
            );
        });

        return schedule;
    };

    const upcomingClasses = getUpcomingClasses();
    const weeklySchedule = getWeeklySchedule();

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-12">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 shadow-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-500 flex items-center justify-center font-bold text-lg">
                            {student.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-lg leading-tight">{student.name}</h1>
                            <p className="text-xs text-gray-400">Alumno</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Status Card */}
                        <div className="bg-gradient-to-br from-purple-900/60 via-purple-800/40 to-fuchsia-900/60 border border-purple-500/50 rounded-xl p-6 shadow-xl shadow-purple-900/20">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Estado de la cuenta</h2>
                                    <p className="text-purple-200 text-sm">
                                        {student.active ? '✅ Matrícula Activa' : '❌ Matrícula Inactiva'}
                                    </p>
                                </div>
                                <div className="text-right bg-black/20 p-3 rounded-lg">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest">Cuota Mensual</p>
                                    <p className="text-2xl font-bold text-white font-mono">{formatCurrency(student.monthlyFee)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Personal Data & Change Requests Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    👤 Mis Datos Personales
                                </h3>
                                <button
                                    onClick={() => setShowChangeRequestModal(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg"
                                >
                                    Solicitar Cambio
                                </button>
                            </div>

                            {/* Current Data Display */}
                            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Nombre</p>
                                        <p className="text-white font-medium">{student.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Teléfono</p>
                                        <p className="text-white font-medium">{student.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                                        <p className="text-white font-medium">{student.email || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Fecha de Nacimiento</p>
                                        <p className="text-white font-medium">{student.birthDate ? formatDate(student.birthDate) : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">DNI</p>
                                        <p className="text-white font-medium">{student.dni || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pending/Recent Change Requests */}
                            {changeRequests.length > 0 && (
                                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                                    <div className="bg-gray-750 px-4 py-2 border-b border-gray-700">
                                        <h4 className="text-sm font-bold text-white">Solicitudes de Cambio</h4>
                                    </div>
                                    <div className="divide-y divide-gray-700">
                                        {changeRequests.slice(0, 3).map(request => {
                                            const getStatusColor = (status: string) => {
                                                switch (status) {
                                                    case 'Pendiente': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
                                                    case 'Aprobada': return 'bg-green-500/20 text-green-300 border-green-500/30';
                                                    case 'Rechazada': return 'bg-red-500/20 text-red-300 border-red-500/30';
                                                    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
                                                }
                                            };
                                            return (
                                                <div key={request.id} className="p-3">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(request.requestDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold ${getStatusColor(request.status)}`}>
                                                            {request.status}
                                                        </span>
                                                    </div>
                                                    {request.status !== 'Pendiente' && request.reviewNotes && (
                                                        <div className="mt-2 p-2 bg-gray-900/60 rounded border border-gray-700">
                                                            <p className="text-xs text-gray-400 italic">{request.reviewNotes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Change Request Modal */}
                        {showChangeRequestModal && (
                            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                                <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
                                    <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-white">Solicitar Cambio de Datos</h3>
                                        <button
                                            onClick={() => setShowChangeRequestModal(false)}
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        setIsSubmittingRequest(true);
                                        try {
                                            const formData = new FormData(e.currentTarget);
                                            const requestedData = {
                                                name: formData.get('name') as string,
                                                phone: formData.get('phone') as string,
                                                email: formData.get('email') as string,
                                                birthDate: formData.get('birthDate') as string,
                                                dni: formData.get('dni') as string,
                                            };

                                            const currentData = {
                                                name: student.name,
                                                phone: student.phone || '',
                                                email: student.email || '',
                                                birthDate: student.birthDate || '',
                                                dni: student.dni || '',
                                            };

                                            await createChangeRequest(student.id, student.name, currentData, requestedData);

                                            // Reload change requests
                                            const requests = await getChangeRequestsByStudent(student.id);
                                            setChangeRequests(requests);

                                            setShowChangeRequestModal(false);
                                            alert('Solicitud enviada correctamente. El administrador la revisará pronto.');
                                        } catch (error) {
                                            console.error('Error creating change request:', error);
                                            alert('Error al enviar la solicitud. Por favor, inténtalo de nuevo.');
                                        } finally {
                                            setIsSubmittingRequest(false);
                                        }
                                    }} className="p-6 space-y-4">
                                        <p className="text-sm text-gray-400 mb-4">
                                            Rellena los campos que desees modificar. El administrador revisará tu solicitud.
                                        </p>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                                            <input
                                                type="text"
                                                name="name"
                                                defaultValue={student.name}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                defaultValue={student.phone || ''}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                defaultValue={student.email || ''}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de Nacimiento</label>
                                            <input
                                                type="date"
                                                name="birthDate"
                                                defaultValue={student.birthDate || ''}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">DNI</label>
                                            <input
                                                type="text"
                                                name="dni"
                                                defaultValue={student.dni || ''}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                                            <button
                                                type="button"
                                                onClick={() => setShowChangeRequestModal(false)}
                                                className="bg-gray-600 text-gray-200 px-6 py-2.5 rounded-lg hover:bg-gray-500 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmittingRequest}
                                                className="bg-purple-600 text-white px-8 py-2.5 rounded-lg hover:bg-purple-700 font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmittingRequest ? 'Enviando...' : 'Enviar Solicitud'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Merchandise Store */}
                        <section>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                </svg>
                                🛍️ Tienda
                            </h3>
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-purple-500/20 overflow-hidden shadow-lg shadow-purple-900/10 p-6">
                                {merchandise.length > 0 ? (
                                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin', scrollbarColor: '#a855f7 #374151' }}>
                                        {(() => {
                                            // Group products by base name (remove size info)
                                            const grouped = merchandise.reduce((acc, item) => {
                                                // Extract base name (everything before parentheses or size indicators)
                                                const baseName = item.name.replace(/\s*\([^)]*\)$/g, '').trim();
                                                if (!acc[baseName]) {
                                                    acc[baseName] = {
                                                        baseName,
                                                        category: item.category,
                                                        imageUrl: item.imageUrl,
                                                        variants: []
                                                    };
                                                }
                                                acc[baseName].variants.push(item);
                                                return acc;
                                            }, {} as Record<string, { baseName: string; category: string; imageUrl?: string; variants: MerchandiseItem[] }>);

                                            // Product Card Component
                                            const ProductCard = ({ product, formatCurrency }: { product: { baseName: string; category: string; imageUrl?: string; variants: MerchandiseItem[] }, formatCurrency: (amount: number) => string }) => {
                                                const [selectedVariant, setSelectedVariant] = React.useState(product.variants[0]);

                                                return (
                                                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all group flex-shrink-0 w-64 snap-start">
                                                        {/* Product Image */}
                                                        <div className="aspect-square bg-gray-900 relative overflow-hidden">
                                                            {product.imageUrl ? (
                                                                <img
                                                                    src={product.imageUrl}
                                                                    alt={product.baseName}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            {/* Stock badge */}
                                                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                                {selectedVariant.stock} disponibles
                                                            </div>
                                                        </div>

                                                        {/* Product Info */}
                                                        <div className="p-3 space-y-2">
                                                            <p className="font-bold text-white text-sm truncate">{product.baseName}</p>
                                                            <p className="text-xs text-gray-400">{product.category}</p>

                                                            {/* Size Selector */}
                                                            {product.variants.length > 1 && (
                                                                <select
                                                                    value={selectedVariant.id}
                                                                    onChange={(e) => {
                                                                        const variant = product.variants.find(v => v.id === e.target.value);
                                                                        if (variant) setSelectedVariant(variant);
                                                                    }}
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded text-white text-xs py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                                >
                                                                    {product.variants.map(variant => (
                                                                        <option key={variant.id} value={variant.id}>
                                                                            {variant.size || 'Única'} - {formatCurrency(variant.salePrice)} ({variant.stock} disp.)
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}

                                                            <div className="flex items-center justify-between pt-1">
                                                                <span className="text-lg font-bold text-purple-400 font-mono">
                                                                    {formatCurrency(selectedVariant.salePrice)}
                                                                </span>
                                                                <a
                                                                    href={`https://wa.me/34692038911?text=${encodeURIComponent(
                                                                        `Hola, me gustaría comprar:\n\n📦 ${product.baseName}${selectedVariant.size ? ` (${selectedVariant.size})` : ''}\n💰 Precio: ${formatCurrency(selectedVariant.salePrice)}\n\n¿Está disponible?`
                                                                    )}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-xs px-3 py-1.5 rounded-lg transition-all shadow-md hover:shadow-lg hover:shadow-purple-500/50 font-semibold inline-flex items-center gap-1"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                                                    </svg>
                                                                    Solicitar
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            };

                                            return Object.values(grouped).map(product => (
                                                <ProductCard key={product.baseName} product={product} formatCurrency={formatCurrency} />
                                            ));
                                        })()}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        <p className="text-gray-500 italic">No hay artículos disponibles en este momento.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* My Events Section */}
                        <section>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-fuchsia-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                🎭 Mis Eventos
                            </h3>
                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
                                {events.length > 0 ? (
                                    <div className="divide-y divide-gray-700">
                                        {events.map(event => {
                                            const participant = event.participants.find(p => p.studentId === student.id);
                                            const ticketCount = participant?.ticketCount || 0;
                                            const getTypeColor = (type: string) => {
                                                switch (type) {
                                                    case 'Competición': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                                                    case 'Exhibición': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                                                    case 'Taller': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
                                                    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
                                                }
                                            };
                                            return (
                                                <div key={event.id} className="p-4 hover:bg-gray-750/50 transition-colors">
                                                    <div className="flex gap-4">
                                                        {/* Event Image */}
                                                        {event.imageUrl && (
                                                            <div className="w-20 h-28 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                                                                <img
                                                                    src={event.imageUrl}
                                                                    alt={event.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Event Details */}
                                                        <div className="flex-grow">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <h4 className="font-bold text-white text-lg leading-tight">{event.name}</h4>
                                                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${getTypeColor(event.type)}`}>
                                                                        {event.type}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 text-sm">
                                                                {/* Date & Time */}
                                                                <div className="flex items-center text-gray-400">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span className="text-white font-medium">
                                                                        {formatDate(event.date)} · {event.time}
                                                                    </span>
                                                                </div>

                                                                {/* Location */}
                                                                <div className="flex items-center text-gray-400">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span className="text-white font-medium">{event.location}</span>
                                                                </div>

                                                                {/* Tickets */}
                                                                <div className="flex items-center text-gray-400">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                                                                    </svg>
                                                                    <span className="text-white font-medium">
                                                                        {ticketCount} {ticketCount === 1 ? 'entrada' : 'entradas'}
                                                                    </span>
                                                                    <span className="mx-2 text-gray-600">•</span>
                                                                    <span className="text-green-400 font-bold">
                                                                        {formatCurrency(event.price * ticketCount)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Notes */}
                                                            {event.notes && (
                                                                <div className="mt-3 p-2 bg-gray-900/60 rounded-lg border border-gray-700">
                                                                    <p className="text-xs text-gray-400 italic leading-relaxed">{event.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="p-6 text-center text-gray-500 italic">No estás inscrito en ningún evento próximo.</p>
                                )}
                            </div>
                        </section>

                        {/* Upcoming Classes - Next 7 Days */}
                        <section>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Próximas Clases (7 días)
                            </h3>
                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
                                {upcomingClasses.length > 0 ? (
                                    <div className="divide-y divide-gray-700">
                                        {upcomingClasses.map((day, idx) => (
                                            <div key={idx} className="p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-purple-500' : 'bg-gray-500'}`}></div>
                                                    <p className="font-semibold text-white">
                                                        {day.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </p>
                                                    {idx === 0 && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Hoy</span>}
                                                </div>
                                                <div className="space-y-2 ml-4">
                                                    {day.classes.map(cls => (
                                                        <div key={cls.id} className="flex items-center justify-between bg-gray-750/50 p-3 rounded-lg">
                                                            <div>
                                                                <p className="font-medium text-white">{cls.name}</p>
                                                                <p className="text-xs text-gray-400">{cls.category}</p>
                                                            </div>
                                                            <span className="text-sm font-mono text-purple-300">{formatTime(cls.startTime)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="p-6 text-center text-gray-500 italic">No tienes clases programadas en los próximos 7 días.</p>
                                )}
                            </div>
                        </section>









                        {/* Recent Payments */}
                        <section>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Historial de Pagos
                            </h3>
                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
                                {payments.length > 0 ? (
                                    <div className="divide-y divide-gray-700">
                                        {payments.map(payment => (
                                            <div key={payment.id} className="p-4 flex justify-between items-center hover:bg-gray-750 transition-colors">
                                                <div>
                                                    <p className="font-medium text-white">{payment.concept}</p>
                                                    <p className="text-xs text-gray-400">{formatDate(payment.date)} • {payment.paymentMethod}</p>
                                                </div>
                                                <span className="font-bold text-green-400 font-mono">
                                                    {formatCurrency(payment.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="p-6 text-center text-gray-500 italic">No tienes pagos registrados aún.</p>
                                )}
                            </div>
                        </section>







                        {/* Recent Attendance */}
                        <section>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Actividad Reciente
                            </h3>
                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
                                {attendance.length > 0 ? (
                                    <div className="divide-y divide-gray-700">
                                        {attendance.slice(0, 10).map(record => {
                                            const isPresent = record.presentStudentIds.includes(student.id);
                                            const className = classes.find(c => c.id === record.classId)?.name || 'Clase desconocida';
                                            return (
                                                <div key={record.id} className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${isPresent ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{className}</p>
                                                            <p className="text-xs text-gray-400">{formatDate(record.date)}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded font-bold ${isPresent ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                        {isPresent ? 'ASISTIDO' : 'FALTA'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="p-6 text-center text-gray-500 italic">No hay registros de asistencia recientes.</p>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default StudentPortal;
