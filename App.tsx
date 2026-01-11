
import React, { Suspense, lazy } from 'react';
import { View } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Modal from './components/Modal';
import { useAppStore } from './src/store/useAppStore';
import { useInitializeData } from './src/hooks/useInitializeData';
import { useAppActions } from './src/hooks/useAppActions';
import { batchAddStudents, batchAddInstructors, batchAddClasses, batchAddPayments, batchAddCosts, batchAddMerchandiseItems } from './src/services/firestoreService';

// Lazy Loaded Components
const Dashboard = lazy(() => import('./components/Dashboard'));
const StudentList = lazy(() => import('./components/StudentList'));
const ClassSchedule = lazy(() => import('./components/ClassSchedule'));
const InstructorList = lazy(() => import('./components/InstructorList'));
const Billing = lazy(() => import('./components/Billing'));
const InteractiveSchedule = lazy(() => import('./components/InteractiveSchedule'));
const NuptialDances = lazy(() => import('./components/NuptialDances'));
const DataManagement = lazy(() => import('./components/DataManagement'));
const Merchandising = lazy(() => import('./components/Merchandising'));
const QuarterlyInvoicing = lazy(() => import('./components/QuarterlyInvoicing'));
const Attendance = lazy(() => import('./components/Attendance'));
const EventManagement = lazy(() => import('./components/EventManagement'));

const Loader = () => (
    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin"></div>
);

const App: React.FC = () => {
    // Initialize Data & Subscriptions
    useInitializeData();

    // Actions & State
    const actions = useAppActions();
    const {
        user,
        authLoading,
        dataLoading,
        currentView,
        setCurrentView,
        isSidebarOpen,
        setSidebarOpen,
        isBirthdayModalOpen,
        setBirthdayModalOpen,
        birthdaysToday,
        students,
        instructors,
        classes,
        payments,
        costs,
        nuptialDances,
        events,
        merchandiseItems,
        merchandiseSales,
        attendanceRecords
    } = useAppStore();

    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-200">
                <Loader />
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
                    <Loader />
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
                    events={events}
                    setView={setCurrentView}
                    addPayment={actions.addPayment}
                />;
            case View.ATTENDANCE:
                return <Attendance
                    students={students}
                    classes={classes}
                    attendanceRecords={attendanceRecords}
                    onSaveAttendance={actions.saveAttendance}
                />;
            case View.STUDENTS:
                return <StudentList students={students} classes={classes} merchandiseSales={merchandiseSales} addStudent={actions.addStudent} updateStudent={actions.updateStudent} deleteStudent={actions.deleteStudent} />;
            case View.CLASSES:
                return <ClassSchedule classes={classes} instructors={instructors} students={students} addClass={actions.addClass} updateClass={actions.updateClass} deleteClass={actions.deleteClass} />;
            case View.INTERACTIVE_SCHEDULE:
                return <InteractiveSchedule classes={classes} instructors={instructors} students={students} updateClass={actions.updateClass} />;
            case View.INSTRUCTORS:
                return <InstructorList instructors={instructors} classes={classes} addInstructor={actions.addInstructor} updateInstructor={actions.updateInstructor} deleteInstructor={actions.deleteInstructor} />;
            case View.BILLING:
                return <Billing
                    payments={payments}
                    costs={costs}
                    students={students}
                    classes={classes}
                    merchandiseSales={merchandiseSales}
                    instructors={instructors}
                    addPayment={actions.addPayment}
                    updatePayment={actions.updatePayment}
                    deletePayment={actions.deletePayment}
                    addCost={actions.addCost}
                    updateCost={actions.updateCost}
                    deleteCost={actions.deleteCost}
                    updateStudent={actions.updateStudent}
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
                    addItem={actions.addMerchandiseItem}
                    updateItem={actions.updateMerchandiseItem}
                    deleteItem={actions.deleteMerchandiseItem}
                    addSale={actions.addMerchandiseSale}
                    deleteSale={actions.deleteMerchandiseSale}
                />;
            case View.NUPTIAL_DANCES:
                return <NuptialDances
                    nuptialDances={nuptialDances}
                    instructors={instructors}
                    addNuptialDance={actions.addNuptialDance}
                    updateNuptialDance={actions.updateNuptialDance}
                    deleteNuptialDance={actions.deleteNuptialDance}
                />;
            case View.EVENTS:
                return <EventManagement
                    events={events}
                    students={students}
                    addEvent={actions.addEvent}
                    updateEvent={actions.updateEvent}
                    deleteEvent={actions.deleteEvent}
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
                    events={events}
                    setView={setCurrentView}
                    addPayment={actions.addPayment}
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
                onLogout={actions.handleLogout}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header setIsOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 custom-scrollbar relative">
                    <Suspense fallback={
                        <div className="flex justify-center items-center h-full">
                            <Loader />
                        </div>
                    }>
                        {renderView()}
                    </Suspense>
                </main>
            </div>

            <Modal
                isOpen={isBirthdayModalOpen}
                onClose={() => setBirthdayModalOpen(false)}
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
                            onClick={() => setBirthdayModalOpen(false)}
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
