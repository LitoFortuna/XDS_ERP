
import React, { useEffect, useState } from 'react';
import { Student, Payment, AttendanceRecord, DanceClass, MerchandiseItem, MerchandiseSale, DanceEvent, ChangeRequest, StudentPrivateData, StudentProgress } from '../../../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { getStudentPrivateData } from '../../services/domain/studentService';
import { filterActive } from '../../services/domain/trashService';
import { createChangeRequest, getChangeRequestsByStudent } from '../../../services/changeRequestService';
import { getStudentProgress, getLevelInfo, calculateYearlyDisplayStats } from '../../../services/progressService';
import BottomNavigation, { PortalPage } from './BottomNavigation';
import HomePage from './pages/HomePage';
import ProgressPage from './pages/ProgressPage';
import ProfilePage from './pages/ProfilePage';
import StorePage from './pages/StorePage';
import EventsPage from './pages/EventsPage';
import StudentNotificationPrompter from './StudentNotificationPrompter';
import { loadPortalSnapshot, savePortalSnapshot } from '../../utils/portalOfflineCache';
import { getInstructorIdsForStudent } from '../../utils/classInstructors';

interface StudentPortalProps {
    student: Student;
    onLogout: () => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ student, onLogout }) => {
    const [currentPage, setCurrentPage] = useState<PortalPage>('home');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [classes, setClasses] = useState<DanceClass[]>([]);
    const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
    const [sales, setSales] = useState<MerchandiseSale[]>([]); // compras de esta alumna (logros de camiseta, sudadera, mochila)
    const [events, setEvents] = useState<DanceEvent[]>([]);
    const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
    const [privateData, setPrivateData] = useState<StudentPrivateData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    // Modo sin conexión: se avisa cuando no hay red y, si los datos que se ven vienen de la copia
    // local (portalOfflineCache) en vez de Firestore, se indica de cuándo son.
    const [isOnline, setIsOnline] = useState(() => navigator.onLine !== false);
    const [offlineSavedAt, setOfflineSavedAt] = useState<string | null>(null);

    // Progress data for HomePage
    const [currentStreak, setCurrentStreak] = useState(0);
    const [level, setLevel] = useState(1);
    const [levelName, setLevelName] = useState('Principiante');
    const [levelIcon, setLevelIcon] = useState('🌱');

    useEffect(() => {
        const goOnline = () => { setIsOnline(true); setReloadKey(k => k + 1); }; // al volver la red se refresca todo
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    useEffect(() => {
        const loadStudentData = async () => {
            setLoadError(false);
            const snapshot = loadPortalSnapshot(student.id);
            try {
                console.log('[StudentPortal] Loading data for student:', student.name, student.id);

                // Sin red y con copia local: se muestra directamente, sin esperar a que Firestore falle.
                if (navigator.onLine === false && snapshot) {
                    setPayments(snapshot.payments);
                    setClasses(snapshot.classes);
                    setEvents(snapshot.events);
                    setSales(snapshot.sales || []);
                    if (snapshot.progress) {
                        setCurrentStreak(snapshot.progress.currentStreak);
                        setLevel(snapshot.progress.level);
                        setLevelName(snapshot.progress.levelName);
                        setLevelIcon(snapshot.progress.levelIcon);
                    }
                    setOfflineSavedAt(snapshot.savedAt);
                    return;
                }

                // Promise.allSettled en vez de Promise.all: si UNA sola de estas 9 lecturas falla
                // (p.ej. un permiso denegado puntual o una red inestable), antes se perdía TODO
                // -- pagos, asistencia, clases, etc. quedaban en su array inicial vacío y la
                // alumna veía un portal "cargado" pero completamente vacío, sin ningún aviso de
                // que algo había fallado. Ahora cada lectura fallida cae a su valor por defecto
                // por separado y se muestra un aviso con botón de reintentar.
                const results = await Promise.allSettled([
                    // Payments
                    getDocs(query(collection(db, 'payments'), where('studentId', '==', student.id))).then(snap => {
                        const data = filterActive(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
                        const currentYear = new Date().getFullYear();
                        return data.filter(p => new Date(p.date).getFullYear() === currentYear)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    }),

                    // Attendance records - searching in presentStudentIds array
                    getDocs(query(collection(db, 'attendance'), where('presentStudentIds', 'array-contains', student.id))).then(snap =>
                        snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord))
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    ),

                    // Classes
                    getDocs(collection(db, 'classes')).then(snap =>
                        filterActive(snap.docs.map(d => ({ id: d.id, ...d.data() } as DanceClass)))
                    ),

                    // Merchandise
                    getDocs(collection(db, 'merchandiseItems')).then(snap =>
                        snap.docs.map(d => ({ id: d.id, ...d.data() } as MerchandiseItem))
                    ),

                    // Events - fetch all (se necesitan también los eventos en los que la alumna
                    // TODAVÍA NO está apuntada, para poder ofrecerle unirse desde EventsPage).
                    getDocs(collection(db, 'events')).then(snap =>
                        filterActive(snap.docs.map(d => ({ id: d.id, ...d.data() } as DanceEvent)))
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    ),

                    // Change requests
                    getChangeRequestsByStudent(student.id),

                    // Progress data
                    getStudentProgress(student.id),

                    // Instructors (for name resolution)
                    getDocs(collection(db, 'instructors')),

                    // Private data (DNI/IBAN) — requires the Firebase Auth session from login to
                    // be ready; if it isn't (or the fetch fails for any reason) we just show
                    // "Pendiente" instead of blocking the rest of the portal.
                    auth.authStateReady()
                        .then(() => getStudentPrivateData(student.id))
                        .catch(() => null),

                    // Compras de merchandising de esta alumna, para los logros de la camiseta, la sudadera y la mochila.
                    getDocs(query(collection(db, 'merchandiseSales'), where('studentId', '==', student.id))).then(snap =>
                        snap.docs.map(d => ({ id: d.id, ...d.data() } as MerchandiseSale))
                    )
                ]);

                // Cada lectura que falló cae a un valor por defecto seguro en vez de tirar abajo
                // toda la carga; se avisa aparte si hubo algún fallo real (ver loadError más abajo).
                const getValue = <T,>(result: PromiseSettledResult<T>, fallback: T): T => {
                    if (result.status === 'fulfilled') return result.value;
                    console.error('[StudentPortal] Fallo cargando datos:', result.reason);
                    return fallback;
                };
                const anyFailed = results.some(r => r.status === 'rejected');

                // Pagos (0), clases (2) y eventos (4) tienen copia local: si fallan (p.ej. sin red) se
                // usa esa copia en vez de dejar la pantalla vacía.
                let usedCachedData = false;
                const withCache = <T,>(result: PromiseSettledResult<T>, fallback: T, cached: T | undefined): T => {
                    if (result.status === 'fulfilled') return result.value;
                    if (cached !== undefined) {
                        console.warn('[StudentPortal] Usando la copia local por un fallo de carga:', result.reason);
                        usedCachedData = true;
                        return cached;
                    }
                    return getValue(result, fallback);
                };

                const paymentsData = withCache(results[0], [] as Payment[], snapshot?.payments);
                const attendanceData = getValue(results[1], [] as AttendanceRecord[]);
                const classesData = withCache(results[2], [] as DanceClass[], snapshot?.classes);
                const merchandiseData = getValue(results[3], [] as MerchandiseItem[]);
                const eventsData = withCache(results[4], [] as DanceEvent[], snapshot?.events);
                const requestsData = getValue(results[5], [] as ChangeRequest[]);
                const progressData = getValue(results[6], null as StudentProgress | null);
                const instructorsSnapshot = getValue(results[7], { docs: [] } as any); // QuerySnapshot
                const privateDataResult = getValue(results[8], null as StudentPrivateData | null);
                const salesData = withCache(results[9], [] as MerchandiseSale[], snapshot?.sales);

                // Create instructor map
                const instructorMap = new Map();
                instructorsSnapshot.docs.forEach((doc: any) => {
                    const data = doc.data();
                    instructorMap.set(doc.id, data.name || data.email);
                });

                // Enrich classes with instructor names (la copia local ya los trae resueltos)
                const classesFromCache = results[2].status === 'rejected' && !!snapshot;
                const enrichedClasses = classesFromCache ? classesData : classesData.map(c => ({
                    ...c,
                    instructorName: getInstructorIdsForStudent(c, student).map(id => instructorMap.get(id)).filter(Boolean).join(', ')
                        || instructorMap.get(c.instructorId) || (c as any).instructor || 'Sin Asignar'
                }));

                setPayments(paymentsData);
                setAttendance(attendanceData);
                setClasses(enrichedClasses);
                setMerchandise(merchandiseData);
                setSales(salesData);
                setEvents(eventsData);
                setChangeRequests(requestsData);
                setPrivateData(privateDataResult);

                // Mismo cálculo que la pestaña Progreso (ProgressDashboard.tsx) -- antes esta
                // pantalla usaba TODA la asistencia histórica mientras Progreso solo contaba la
                // del año en curso, así que una alumna con historial de años anteriores veía un
                // nivel/racha distinto según la pestaña en la que estuviera.
                const { displayPoints: yearlyPoints, clientStreak } = calculateYearlyDisplayStats(attendanceData);
                setCurrentStreak(clientStreak);

                const displayPoints = Math.max(progressData?.points ?? 0, yearlyPoints);
                const levelInfo = getLevelInfo(displayPoints);
                setLevel(levelInfo.level);
                setLevelName(levelInfo.name);
                setLevelIcon(levelInfo.icon);

                setOfflineSavedAt(usedCachedData && snapshot ? snapshot.savedAt : null);
                // Solo cuenta como error lo que la copia local no ha podido cubrir.
                const uncoveredFailure = results.some((r, i) => r.status === 'rejected' && !(snapshot && (i === 0 || i === 2 || i === 4 || i === 9)));
                if (uncoveredFailure) setLoadError(true);

                // Carga completa: se renueva la copia local para el próximo uso sin conexión.
                if (!anyFailed) {
                    savePortalSnapshot({
                        student,
                        classes: enrichedClasses,
                        events: eventsData,
                        payments: paymentsData,
                        sales: salesData,
                        progress: { currentStreak: clientStreak, level: levelInfo.level, levelName: levelInfo.name, levelIcon: levelInfo.icon },
                    });
                }
                console.log('[StudentPortal] Data loaded', anyFailed ? '(con fallos)' : 'successfully');
            } catch (error) {
                console.error('[StudentPortal] Error loading data:', error);
                setLoadError(true);
            } finally {
                setIsLoading(false);
            }
        };

        loadStudentData();
    }, [student.id, reloadKey]);

    // Tras unirse a un evento o comprar en la Tienda, basta con refrescar esa única colección en
    // vez de recargar todo el Portal (los 9 fetches en paralelo de más arriba).
    const refetchEvents = () => {
        getDocs(collection(db, 'events'))
            .then(snap => filterActive(snap.docs.map(d => ({ id: d.id, ...d.data() } as DanceEvent)))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
            .then(setEvents)
            .catch(err => console.error('[StudentPortal] Error refrescando eventos:', err));
    };

    const refetchMerchandise = () => {
        getDocs(collection(db, 'merchandiseItems'))
            .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as MerchandiseItem)))
            .then(setMerchandise)
            .catch(err => console.error('[StudentPortal] Error refrescando la tienda:', err));
    };

    const handleRequestChange = () => {
        setShowChangeRequestModal(true);
    };

    const handleSubmitChangeRequest = async (formData: any) => {
        setIsSubmittingRequest(true);
        try {
            await createChangeRequest(student.id, student.name, {
                name: student.name,
                phone: student.phone,
                birthDate: student.birthDate,
                email: student.email,
                dni: privateData?.dni,
            }, formData);

            alert('✅ Solicitud enviada correctamente. Será revisada por el equipo administrativo.');
            setShowChangeRequestModal(false);

            // Refresh change requests
            const updatedRequests = await getChangeRequestsByStudent(student.id);
            setChangeRequests(updatedRequests);
        } catch (error) {
            console.error('[StudentPortal] Error submitting change request:', error);
            alert('❌ Error al enviar la solicitud. Inténtalo de nuevo.');
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    const getUpcomingClasses = () => {
        const today = new Date();
        const todayDayName = today.toLocaleDateString('es-ES', { weekday: 'long' });
        const capitalizedToday = todayDayName.charAt(0).toUpperCase() + todayDayName.slice(1);

        // Filter by enrolled classes AND today's day
        const enrolledClasses = classes.filter(c => student.enrolledClassIds?.includes(c.id));
        const todayClasses = enrolledClasses.filter(c => c.days.includes(capitalizedToday));
        return todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const getPageTitle = () => {
        switch (currentPage) {
            case 'home': return 'Inicio';
            case 'progress': return 'Mi Progreso';
            case 'profile': return 'Mi Perfil';
            case 'store': return 'Tienda';
            case 'events': return 'Eventos';
            default: return 'Portal del Estudiante';
        }
    };

    const upcomingClasses = getUpcomingClasses();

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-20">
            <StudentNotificationPrompter studentId={student.id} />
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 shadow-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/pwa-192x192.png" alt="XDS Logo" className="w-12 h-12 rounded-lg object-contain" />
                        <div>
                            <h1 className="font-bold text-white text-lg leading-tight">{getPageTitle()}</h1>
                            <p className="text-xs text-gray-400">{student.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-gray-400 hover:text-white transition-colors text-sm px-3 py-2.5 -mr-3 rounded-lg"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-6">
                {(!isOnline || offlineSavedAt) && !isLoading && (
                    <div role="status" className="mb-6 bg-amber-900/30 border border-amber-500/40 text-amber-100 px-4 py-3 rounded-lg text-sm">
                        📴 Sin conexión.{' '}
                        {offlineSavedAt
                            ? `Estás viendo la información guardada el ${new Date(offlineSavedAt).toLocaleString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}. `
                            : 'Puedes seguir consultando tu horario. '}
                        Comprar, apuntarte a un evento o avisar de una ausencia necesita internet.
                    </div>
                )}
                {loadError && !isLoading && (
                    <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-3">
                        <span>⚠️ Algunos datos no se han podido cargar. Es posible que falte información en esta pantalla.</span>
                        <button
                            onClick={() => setReloadKey(k => k + 1)}
                            className="shrink-0 bg-red-800/60 hover:bg-red-800 text-white px-3 py-1.5 rounded-md font-medium"
                        >
                            Reintentar
                        </button>
                    </div>
                )}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : (
                    <>
                        {currentPage === 'home' && (
                            <HomePage
                                student={student}
                                upcomingClasses={upcomingClasses}
                                enrolledClasses={classes.filter(c => student.enrolledClassIds?.includes(c.id))}
                                payments={payments}
                                currentStreak={currentStreak}
                                level={level}
                                levelName={levelName}
                                levelIcon={levelIcon}
                                onNavigate={setCurrentPage}
                            />
                        )}
                        {currentPage === 'progress' && (
                            <ProgressPage
                                student={student}
                                attendanceRecords={attendance}
                                allClasses={classes}
                                events={events}
                                sales={sales}
                            />
                        )}
                        {currentPage === 'profile' && (
                            <ProfilePage
                                student={student}
                                privateData={privateData}
                                allClasses={classes}
                                changeRequests={changeRequests}
                                onRequestChange={handleRequestChange}
                            />
                        )}
                        {currentPage === 'store' && (
                            <StorePage merchandise={merchandise} onPurchaseComplete={refetchMerchandise} />
                        )}
                        {currentPage === 'events' && (
                            <EventsPage
                                student={student}
                                allEvents={events}
                                allClasses={classes}
                                onEventJoined={refetchEvents}
                            />
                        )}
                    </>
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation
                currentPage={currentPage}
                onNavigate={setCurrentPage}
            />

            {/* Change Request Modal */}
            {showChangeRequestModal && (
                <ChangeRequestModal
                    student={student}
                    studentDni={privateData?.dni}
                    onClose={() => setShowChangeRequestModal(false)}
                    onSubmit={handleSubmitChangeRequest}
                    isSubmitting={isSubmittingRequest}
                />
            )}
        </div>
    );
};

// Change Request Modal Component
interface ChangeRequestModalProps {
    student: Student;
    studentDni?: string;
    onClose: () => void;
    onSubmit: (formData: any) => void;
    isSubmitting: boolean;
}

const ChangeRequestModal: React.FC<ChangeRequestModalProps> = ({ student, studentDni, onClose, onSubmit, isSubmitting }) => {
    const [formData, setFormData] = useState({
        name: student.name,
        phone: student.phone || '',
        birthDate: student.birthDate || '',
        email: student.email || '',
        dni: studentDni || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">Solicitar Cambio de Datos</h3>
                        <button
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="text-gray-400 hover:text-white transition-colors p-2 -m-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Nombre completo</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Teléfono</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Fecha de nacimiento</label>
                        <input
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">DNI</label>
                        <input
                            type="text"
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentPortal;
