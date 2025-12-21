
import React, { useState, useEffect } from 'react';
import { View, Student, Instructor, DanceClass, Payment, Cost, NuptialDance, MerchandiseItem, MerchandiseSale, AttendanceRecord, DanceEvent } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import ClassSchedule from './components/ClassSchedule';
import InstructorList from './components/InstructorList';
import Billing from './components/Billing';
import InteractiveSchedule from './components/InteractiveSchedule';
import NuptialDances from './components/NuptialDances';
import DataManagement from './components/DataManagement';
import Merchandising from './components/Merchandising';
import QuarterlyInvoicing from './components/QuarterlyInvoicing';
import Attendance from './components/Attendance';
import EventManagement from './components/EventManagement';
import Login from './components/Login';
import Modal from './components/Modal'; 
import { auth } from './src/config/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
    subscribeToStudents,
    addStudent as addStudentToDb,
    updateStudent as updateStudentInDb,
    deleteStudent as deleteStudentFromDb,
    batchAddStudents,
    subscribeToInstructors,
    addInstructor as addInstructorToDb,
    updateInstructor as updateInstructorInDb,
    deleteInstructor as deleteInstructorFromDb,
    batchAddInstructors,
    subscribeToClasses,
    addClass as addClassToDb,
    updateClass as updateClassInDb,
    deleteClass as deleteClassFromDb,
    batchAddClasses,
    subscribeToPayments,
    addPayment as addPaymentToDb,
    updatePayment as updatePaymentInDb,
    deletePayment as deletePaymentFromDb,
    batchAddPayments,
    subscribeToCosts,
    addCost as addCostToDb,
    batchAddCosts,
    updateCost as updateCostInDb,
    deleteCost as deleteCostFromDb,
    subscribeToNuptialDances,
    addNuptialDance as addNuptialDanceToDb,
    updateNuptialDance as updateNuptialDanceInDb,
    deleteNuptialDance as deleteNuptialDanceFromDb,
    subscribeToEvents,
    addEvent as addEventToDb,
    updateEvent as updateEventInDb,
    deleteEvent as deleteEventFromDb,
    subscribeToMerchandiseItems,
    addMerchandiseItem as addMerchandiseItemToDb,
    updateMerchandiseItem as updateMerchandiseItemInDb,
    deleteMerchandiseItem as deleteMerchandiseItemFromDb,
    batchAddMerchandiseItems,
    subscribeToMerchandiseSales,
    addMerchandiseSale as addMerchandiseSaleToDb,
    deleteMerchandiseSale as deleteMerchandiseSaleFromDb,
    subscribeToAttendance,
    addAttendance as addAttendanceToDb,
    updateAttendance as updateAttendanceInDb,
} from './src/services/firestoreService';

const SaturnLoader = () => (
    <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute w-10 h-10 bg-purple-600 rounded-full shadow-[0_0_20px_rgba(147,51,234,0.6)] z-10"></div>
        <div className="absolute inset-0 flex items-center justify-center rotate-[-20deg]">
             <div className="w-20 h-6 border-[3px] border-blue-900/30 border-t-cyan-400 border-l-blue-500 rounded-[50%] animate-[spin_1s_linear_infinite] shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        </div>
    </div>
);

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    
    const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
    const [birthdaysToday, setBirthdaysToday] = useState<Student[]>([]);
    const [hasCheckedBirthdays, setHasCheckedBirthdays] = useState(false);

    const [students, setStudents] = useState<Student[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [classes, setClasses] = useState<DanceClass[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [costs, setCosts] = useState<Cost[]>([]);
    const [nuptialDances, setNuptialDances] = useState<NuptialDance[]>([]);
    const [events, setEvents] = useState<DanceEvent[]>([]);
    const [merchandiseItems, setMerchandiseItems] = useState<MerchandiseItem[]>([]);
    const [merchandiseSales, setMerchandiseSales] = useState<MerchandiseSale[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
            if (!currentUser) {
                setDataLoading(true);
                setHasCheckedBirthdays(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;

        const unsubscribers = [
            subscribeToStudents(setStudents),
            subscribeToInstructors(setInstructors),
            subscribeToClasses(setClasses),
            subscribeToPayments(setPayments),
            subscribeToCosts(setCosts),
            subscribeToNuptialDances(setNuptialDances),
            subscribeToEvents(setEvents),
            subscribeToMerchandiseItems(setMerchandiseItems),
            subscribeToMerchandiseSales(setMerchandiseSales),
            subscribeToAttendance(setAttendanceRecords),
        ];

        const timer = setTimeout(() => {
            setDataLoading(false);
        }, 1500);

        return () => {
          unsubscribers.forEach(unsub => unsub());
          clearTimeout(timer);
        };
    }, [user]);

    useEffect(() => {
        if (!dataLoading && students.length > 0 && !hasCheckedBirthdays) {
            const today = new Date();
            const todayMonth = today.getMonth();
            const todayDay = today.getDate();

            const todayBirthdays = students.filter(s => {
                if (!s.active || !s.birthDate) return false;
                const dob = new Date(s.birthDate);
                return dob.getDate() === todayDay && dob.getMonth() === todayMonth;
            });

            if (todayBirthdays.length > 0) {
                setBirthdaysToday(todayBirthdays);
                setIsBirthdayModalOpen(true);
            }
            setHasCheckedBirthdays(true);
        }
    }, [dataLoading, students, hasCheckedBirthdays]);

    const addStudent = async (student: Omit<Student, 'id'>) => {
        await addStudentToDb({ 
            ...student, 
            enrollmentDate: student.enrollmentDate || new Date().toISOString().split('T')[0],
            monthlyFee: student.monthlyFee || 19,
            paymentMethod: student.paymentMethod || 'Efectivo',
            enrolledClassIds: student.enrolledClassIds || [],
        });
    };
    const updateStudent = async (updatedStudent: Student) => {
        await updateStudentInDb(updatedStudent);
    };
    const deleteStudent = async (studentId: string) => {
        await deleteStudentFromDb(studentId);
    };

    const addInstructor = async (instructor: Omit<Instructor, 'id'>) => {
        await addInstructorToDb({ 
            ...instructor,
            active: instructor.active !== undefined ? instructor.active : true,
            hireDate: instructor.hireDate || new Date().toISOString().split('T')[0],
        });
    };
    const updateInstructor = async (updatedInstructor: Instructor) => {
        await updateInstructorInDb(updatedInstructor);
    };
    const deleteInstructor = async (instructorId: string) => {
        const isAssigned = classes.some(c => c.instructorId === instructorId);
        if (isAssigned) {
            alert('Este profesor está asignado a clases. Por favor, reasigna esas clases antes de eliminarlo.');
            return;
        }
        await deleteInstructorFromDb(instructorId);
    };

    const addClass = async (danceClass: Omit<DanceClass, 'id'>) => {
        await addClassToDb(danceClass);
    };
    const updateClass = async (updatedClass: DanceClass) => {
        await updateClassInDb(updatedClass);
    };
    const deleteClass = async (classId: string) => {
        const studentsToUpdate = students.filter(s => s.enrolledClassIds?.includes(classId));
        const updatePromises = studentsToUpdate.map(student => {
            const updatedStudent = {
                ...student,
                enrolledClassIds: student.enrolledClassIds.filter(id => id !== classId)
            };
            return updateStudentInDb(updatedStudent);
        });
        await Promise.all(updatePromises);
        await deleteClassFromDb(classId);
    };
    
    const addPayment = async (payment: Omit<Payment, 'id'>) => {
        await addPaymentToDb(payment);
    };
    const updatePayment = async (payment: Payment) => {
        await updatePaymentInDb(payment);
    };
    const deletePayment = async (paymentId: string) => {
        await deletePaymentFromDb(paymentId);
    };

    const addCost = async (cost: Omit<Cost, 'id'>) => {
        await addCostToDb(cost);
    };
    const updateCost = async (updatedCost: Cost) => {
        await updateCostInDb(updatedCost);
    };
    const deleteCost = async (costId: string) => {
        await deleteCostFromDb(costId);
    };

    const addNuptialDance = async (dance: Omit<NuptialDance, 'id'>) => {
        await addNuptialDanceToDb(dance);
    };
    const updateNuptialDance = async (updatedDance: NuptialDance) => {
        await updateNuptialDanceInDb(updatedDance);
    };
    const deleteNuptialDance = async (danceId: string) => {
        await deleteNuptialDanceFromDb(danceId);
    };

    const addEvent = async (event: Omit<DanceEvent, 'id'>) => {
        await addEventToDb(event);
    };
    const updateEvent = async (updatedEvent: DanceEvent) => {
        await updateEventInDb(updatedEvent);
    };
    const deleteEvent = async (eventId: string) => {
        await deleteEventFromDb(eventId);
    };

    const addMerchandiseItem = async (item: Omit<MerchandiseItem, 'id'>) => {
        await addMerchandiseItemToDb(item);
    };
    const updateMerchandiseItem = async (item: MerchandiseItem) => {
        await updateMerchandiseItemInDb(item);
    };
    const deleteMerchandiseItem = async (itemId: string) => {
        await deleteMerchandiseItemFromDb(itemId);
    };
    const addMerchandiseSale = async (sale: Omit<MerchandiseSale, 'id'>) => {
        const itemSold = merchandiseItems.find(item => item.id === sale.itemId);
        if (!itemSold || itemSold.stock < sale.quantity) {
            alert('No hay suficiente stock para realizar esta venta.');
            return;
        }
        await addMerchandiseSaleToDb(sale);
        await updateMerchandiseItemInDb({ ...itemSold, stock: itemSold.stock - sale.quantity });
    };
    const deleteMerchandiseSale = async (sale: MerchandiseSale) => {
        await deleteMerchandiseSaleFromDb(sale.id);
        const itemSold = merchandiseItems.find(item => item.id === sale.itemId);
        if (itemSold) {
             await updateMerchandiseItemInDb({ ...itemSold, stock: itemSold.stock + sale.quantity });
        }
    };

    const saveAttendance = async (record: Omit<AttendanceRecord, 'id'> | AttendanceRecord) => {
        if ('id' in record) {
            await updateAttendanceInDb(record);
        } else {
            await addAttendanceToDb(record);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setCurrentView(View.DASHBOARD);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-200">
                <SaturnLoader />
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    if (dataLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-200">
                <div className="text-center flex flex-col items-center">
                    <SaturnLoader />
                    <h2 className="mt-6 text-2xl font-semibold">Bienvenido, Admin</h2>
                    <p className="text-gray-400 mt-2">Cargando ERP...</p>
                </div>
            </div>
        );
    }

    const renderView = () => {
        switch (currentView) {
            case View.DASHBOARD:
                return <Dashboard 
                            students={students} 
                            classes={classes} 
                            instructors={instructors} 
                            payments={payments} 
                            costs={costs} 
                            nuptialDances={nuptialDances}
                            setView={setCurrentView} 
                            addPayment={addPayment}
                        />;
            case View.ATTENDANCE:
                return <Attendance 
                    students={students}
                    classes={classes}
                    attendanceRecords={attendanceRecords}
                    onSaveAttendance={saveAttendance}
                />;
            case View.STUDENTS:
                return <StudentList students={students} classes={classes} merchandiseSales={merchandiseSales} addStudent={addStudent} updateStudent={updateStudent} deleteStudent={deleteStudent} />;
            case View.CLASSES:
                return <ClassSchedule classes={classes} instructors={instructors} students={students} addClass={addClass} updateClass={updateClass} deleteClass={deleteClass} />;
            case View.INTERACTIVE_SCHEDULE:
                return <InteractiveSchedule classes={classes} instructors={instructors} students={students} updateClass={updateClass} />;
            case View.INSTRUCTORS:
                return <InstructorList instructors={instructors} classes={classes} addInstructor={addInstructor} updateInstructor={updateInstructor} deleteInstructor={deleteInstructor} />;
            case View.BILLING:
                return <Billing 
                    payments={payments} 
                    costs={costs} 
                    students={students}
                    classes={classes}
                    merchandiseSales={merchandiseSales}
                    instructors={instructors}
                    addPayment={addPayment}
                    updatePayment={updatePayment}
                    deletePayment={deletePayment}
                    addCost={addCost}
                    updateCost={updateCost}
                    deleteCost={deleteCost}
                    updateStudent={updateStudent}
                />;
            case View.QUARTERLY_INVOICING:
                return <QuarterlyInvoicing 
                    payments={payments} 
                    students={students} 
                    classes={classes} 
                    merchandiseSales={merchandiseSales} 
                />;
            case View.MERCHANDISING:
                return <Merchandising 
                    items={merchandiseItems} 
                    sales={merchandiseSales} 
                    students={students} 
                    addItem={addMerchandiseItem} 
                    updateItem={updateMerchandiseItem} 
                    deleteItem={deleteMerchandiseItem} 
                    addSale={addMerchandiseSale} 
                    deleteSale={deleteSale} 
                />;
            case View.NUPTIAL_DANCES:
                return <NuptialDances 
                    nuptialDances={nuptialDances} 
                    instructors={instructors} 
                    addNuptialDance={addNuptialDance} 
                    updateNuptialDance={updateNuptialDance} 
                    deleteNuptialDance={deleteNuptialDance} 
                />;
            case View.EVENTS:
                return <EventManagement 
                    events={events} 
                    students={students} 
                    addEvent={addEvent} 
                    updateEvent={updateEvent} 
                    deleteEvent={deleteEvent} 
                />;
            case View.DATA_MANAGEMENT:
                return <DataManagement 
                    students={students} 
                    instructors={instructors} 
                    classes={classes} 
                    merchandiseItems={merchandiseItems} 
                    batchAddStudents={batchAddStudents} 
                    batchAddInstructors={batchAddInstructors} 
                    batchAddClasses={batchAddClasses} 
                    batchAddPayments={batchAddPayments} 
                    batchAddCosts={batchAddCosts} 
                    batchAddMerchandiseItems={batchAddMerchandiseItems} 
                />;
            default:
                return <Dashboard 
                            students={students} 
                            classes={classes} 
                            instructors={instructors} 
                            payments={payments} 
                            costs={costs} 
                            nuptialDances={nuptialDances}
                            setView={setCurrentView} 
                            addPayment={addPayment}
                        />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
            <Sidebar 
                currentView={currentView} 
                setView={setCurrentView} 
                isOpen={isSidebarOpen} 
                setIsOpen={setSidebarOpen} 
                onLogout={handleLogout}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header setIsOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 custom-scrollbar relative">
                    {renderView()}
                </main>
            </div>

            <Modal 
                isOpen={isBirthdayModalOpen} 
                onClose={() => setIsBirthdayModalOpen(false)} 
                title="🎉 ¡Cumpleaños de Hoy! 🎂"
            >
                <div className="text-center p-4">
                    <p className="mb-6 text-lg text-gray-300">
                        Hoy es un día especial para {birthdaysToday.length} {birthdaysToday.length === 1 ? 'alumna' : 'alumnas'}.
                        <br />¡No olvides felicitarlas!
                    </p>
                    <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/30">
                        <ul className="space-y-3">
                            {birthdaysToday.map(s => {
                                const age = s.birthDate ? new Date().getFullYear() - new Date(s.birthDate).getFullYear() : '?';
                                return (
                                    <li key={s.id} className="flex items-center justify-between text-white p-2 rounded hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                                                {s.name.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-lg">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-purple-300 font-mono bg-purple-500/10 px-2 py-1 rounded">{age} años</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="mt-8 flex justify-center">
                        <button 
                            onClick={() => setIsBirthdayModalOpen(false)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-8 rounded-full shadow-lg transform transition hover:scale-105"
                        >
                            ¡Entendido! 🎉
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default App;
