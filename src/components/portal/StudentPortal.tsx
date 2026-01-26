
import React, { useEffect, useState } from 'react';
import { Student, Payment, AttendanceRecord, DanceClass } from '../../../types';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface StudentPortalProps {
    student: Student;
    onLogout: () => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ student, onLogout }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [classes, setClasses] = useState<DanceClass[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStudentData = async () => {
            try {
                // 1. Cargar Pagos
                const paymentsQ = query(
                    collection(db, 'payments'),
                    where('studentId', '==', student.id),
                    orderBy('date', 'desc')
                );
                const paymentsSnap = await getDocs(paymentsQ);
                setPayments(paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));

                // 2. Cargar sus Clases (para mostrar nombres en asistencia)
                const enrolledIds = student.enrolledClassIds || [];

                if (enrolledIds.length > 0) {
                    // Firestore 'in' has simple limits (up to 10/30), assuming student has few classes.
                    // Instead of 'in' query which is limited, let's fetch all classes (small collection usually) or optimize later.
                    // For now, let's fetch all active classes to match names.
                    const classesSnap = await getDocs(collection(db, 'classes'));
                    const allClasses = classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as DanceClass));
                    setClasses(allClasses.filter(c => enrolledIds.includes(c.id)));
                }

                // 3. Cargar Asistencia (limitado a últimos 20 registros donde aparezca el estudiante)
                // OJO: Buscar en array 'presentStudentIds' puede requerir un index compuesto o ser lento sin índice.
                // Workaround: Cargar asistencia de las clases del alumno de los últimos 2 meses.
                // Simplificación actual: fetch all attendance records for user's classes and filter in memory (not scalable but works for MVP).
                if (enrolledIds.length > 0) {
                    const attQ = query(
                        collection(db, 'attendance'),
                        where('classId', 'in', enrolledIds.slice(0, 10)), // Limit 'in' to 10
                        orderBy('date', 'desc'),
                        limit(50)
                    );
                    const attSnap = await getDocs(attQ);
                    const records = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
                    // Filter where student was present OR just show the class record? Better show presence.
                    // Let's show all sessions of their classes, and mark if they attended.
                    setAttendance(records);
                }

            } catch (error) {
                console.error("Error loading portal data:", error);
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

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-12">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 shadow-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">
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
                        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-6 shadow-lg">
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
