import React, { useState, useEffect } from 'react';
import { View, Student, Instructor, DanceClass, Payment, Cost, NuptialDance } from './types';
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
    const [nuptialDances, setNuptialDances] = useState<NuptialDance[]>([]);

    useEffect(() => {
        const unsubscribers = [
            subscribeToStudents(setStudents),
            subscribeToInstructors(setInstructors),
            subscribeToClasses(setClasses),
            subscribeToPayments(setPayments),
            subscribeToCosts(setCosts),
            subscribeToNuptialDances(setNuptialDances),
        ];

        // Set a timeout to hide the loader. This is a simpler, albeit less precise,
        // way to handle initial loading and avoids getting stuck if one subscription fails.
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2500);

        return () => {
          unsubscribers.forEach(unsub => unsub());
          clearTimeout(timer);
        };
    }, []);

    // Student Handlers
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

    // Nuptial Dance Handlers
    const addNuptialDance = async (dance: Omit<NuptialDance, 'id'>) => {
        await addNuptialDanceToDb(dance);
    };
    const updateNuptialDance = async (updatedDance: NuptialDance) => {
        await updateNuptialDanceInDb(updatedDance);
    };
    const deleteNuptialDance = async (danceId: string) => {
        await deleteNuptialDanceFromDb(danceId);
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
                return <Dashboard students={students} classes={classes} instructors={instructors} payments={payments} costs={costs} setView={setCurrentView} />;
            case View.STUDENTS:
                return <StudentList students={students} classes={classes} addStudent={addStudent} updateStudent={updateStudent} deleteStudent={deleteStudent} />;
            case View.CLASSES:
                return <ClassSchedule classes={classes} instructors={instructors} students={students} addClass={addClass} updateClass={updateClass} deleteClass={deleteClass} />;
            case View.INTERACTIVE_SCHEDULE:
                return <InteractiveSchedule classes={classes} instructors={instructors} students={students} updateClass={updateClass} />;
            case View.INSTRUCTORS:
                return <InstructorList instructors={instructors} classes={classes} addInstructor={addInstructor} updateInstructor={updateInstructor} deleteInstructor={deleteInstructor} />;
            case View.BILLING:
                return <Billing payments={payments} costs={costs} students={students} addPayment={addPayment} addCost={addCost} updateCost={updateCost} deleteCost={deleteCost} />;
            case View.NUPTIAL_DANCES:
                return <NuptialDances 
                            nuptialDances={nuptialDances}
                            instructors={instructors}
                            addNuptialDance={addNuptialDance}
                            updateNuptialDance={updateNuptialDance}
                            deleteNuptialDance={deleteNuptialDance}
                        />;
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
                return <Dashboard students={students} classes={classes} instructors={instructors} payments={payments} costs={costs} setView={setCurrentView} />;
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