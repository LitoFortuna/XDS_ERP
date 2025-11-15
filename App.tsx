import React, { useState, useEffect } from 'react';
import { View, Student, Instructor, DanceClass, Payment, Cost } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import ClassSchedule from './components/ClassSchedule';
import InstructorList from './components/InstructorList';
import Billing from './components/Billing';
import InteractiveSchedule from './components/InteractiveSchedule';
import DataManagement from './components/DataManagement';
import {
    subscribeToStudents,
    addStudent as addStudentToDb,
    updateStudent as updateStudentInDb,
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
    batchAddPayments,
    subscribeToCosts,
    addCost as addCostToDb,
    batchAddCosts,
    updateCost as updateCostInDb,
    deleteCost as deleteCostFromDb,
} from './src/services/firestoreService';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [students, setStudents] = useState<Student[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [classes, setClasses] = useState<DanceClass[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [costs, setCosts] = useState<Cost[]>([]);

    useEffect(() => {
        const unsubscribers: (() => void)[] = [];
        
        let loadedFlags = {
            students: false,
            instructors: false,
            classes: false,
            payments: false,
            costs: false,
        };

        const checkAllLoaded = () => {
            if (Object.values(loadedFlags).every(flag => flag)) {
                setLoading(false);
            }
        };

        unsubscribers.push(subscribeToStudents(data => {
            setStudents(data);
            if (!loadedFlags.students) { loadedFlags.students = true; checkAllLoaded(); }
        }));
        unsubscribers.push(subscribeToInstructors(data => {
            setInstructors(data);
            if (!loadedFlags.instructors) { loadedFlags.instructors = true; checkAllLoaded(); }
        }));
        unsubscribers.push(subscribeToClasses(data => {
            setClasses(data);
            if (!loadedFlags.classes) { loadedFlags.classes = true; checkAllLoaded(); }
        }));
        unsubscribers.push(subscribeToPayments(data => {
            setPayments(data);
            if (!loadedFlags.payments) { loadedFlags.payments = true; checkAllLoaded(); }
        }));
        unsubscribers.push(subscribeToCosts(data => {
            setCosts(data);
            if (!loadedFlags.costs) { loadedFlags.costs = true; checkAllLoaded(); }
        }));

        return () => {
          unsubscribers.forEach(unsub => unsub());
        };
    }, []);

    // Student Handlers
    const addStudent = async (student: Omit<Student, 'id'>) => {
        await addStudentToDb({ 
            ...student, 
            monthlyFee: student.monthlyFee || 19,
            paymentMethod: student.paymentMethod || 'Efectivo',
            enrolledClassIds: student.enrolledClassIds || [],
        });
    };
    const updateStudent = async (updatedStudent: Student) => {
        await updateStudentInDb(updatedStudent);
    };

    // Instructor Handlers
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

    // Class Handlers
    const addClass = async (danceClass: Omit<DanceClass, 'id'>) => {
        await addClassToDb(danceClass);
    };
    const updateClass = async (updatedClass: DanceClass) => {
        await updateClassInDb(updatedClass);
    };
    const deleteClass = async (classId: string) => {
        // Un-enroll students from the deleted class
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
    
    // Payment Handlers
    const addPayment = async (payment: Omit<Payment, 'id'>) => {
        await addPaymentToDb(payment);
    };

    // Cost Handlers
    const addCost = async (cost: Omit<Cost, 'id'>) => {
        await addCostToDb(cost);
    };
    const updateCost = async (updatedCost: Cost) => {
        await updateCostInDb(updatedCost);
    };
    const deleteCost = async (costId: string) => {
        await deleteCostFromDb(costId);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-200">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-purple-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h2 className="mt-4 text-2xl font-semibold">Cargando datos...</h2>
                    <p className="text-gray-400">Conectando con la base de datos.</p>
                </div>
            </div>
        );
    }

    const renderView = () => {
        switch (currentView) {
            case View.DASHBOARD:
                return <Dashboard students={students} classes={classes} instructors={instructors} payments={payments} />;
            case View.STUDENTS:
                return <StudentList students={students} classes={classes} addStudent={addStudent} updateStudent={updateStudent} />;
            case View.CLASSES:
                return <ClassSchedule classes={classes} instructors={instructors} students={students} addClass={addClass} updateClass={updateClass} deleteClass={deleteClass} />;
            case View.INTERACTIVE_SCHEDULE:
                return <InteractiveSchedule classes={classes} instructors={instructors} students={students} updateClass={updateClass} />;
            case View.INSTRUCTORS:
                return <InstructorList instructors={instructors} classes={classes} addInstructor={addInstructor} updateInstructor={updateInstructor} deleteInstructor={deleteInstructor} />;
            case View.BILLING:
                return <Billing payments={payments} costs={costs} students={students} addPayment={addPayment} addCost={addCost} updateCost={updateCost} deleteCost={deleteCost} />;
            case View.DATA_MANAGEMENT:
                return <DataManagement 
                            students={students}
                            instructors={instructors}
                            classes={classes}
                            batchAddStudents={batchAddStudents} 
                            batchAddInstructors={batchAddInstructors}
                            batchAddClasses={batchAddClasses}
                            batchAddPayments={batchAddPayments}
                            batchAddCosts={batchAddCosts}
                        />;
            default:
                return <Dashboard students={students} classes={classes} instructors={instructors} payments={payments} />;
        }
    };

    return (
        <div className="relative min-h-screen lg:flex font-sans">
            <Sidebar 
                currentView={currentView} 
                setView={setCurrentView} 
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <Header setIsOpen={setSidebarOpen} />
                <main className="flex-1 overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default App;