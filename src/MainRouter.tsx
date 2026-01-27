
import React, { useState, useEffect } from 'react';
import App from '../App';
import StudentLogin from './components/portal/StudentLogin';
import StudentPortal from './components/portal/StudentPortal';
import { Student } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';

import { InstallPrompt } from './components/InstallPrompt';

const MainRouter: React.FC = () => {
    // Simple routing state
    // 'erp': Admin interface
    // 'portal': Student portal
    const [mode, setMode] = useState<'erp' | 'portal'>('erp');
    const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
    const [isLoadingStudent, setIsLoadingStudent] = useState(false);

    useEffect(() => {
        // Check URL path to force mode
        const path = window.location.pathname;
        if (path === '/portal' || path === '/portal/') {
            setMode('portal');
        }

        // Check local storage for persistent student session
        const storedStudentId = localStorage.getItem('student_portal_id');
        if (storedStudentId) {
            setMode('portal'); // Auto-switch to portal if session exists
            setIsLoadingStudent(true);
            // Re-fetch student data to ensure valid session
            getDoc(doc(db, 'students', storedStudentId)).then(snap => {
                if (snap.exists()) {
                    setCurrentStudent({ id: snap.id, ...snap.data() } as Student);
                } else {
                    localStorage.removeItem('student_portal_id');
                }
            }).catch(() => {
                localStorage.removeItem('student_portal_id');
            }).finally(() => {
                setIsLoadingStudent(false);
            });
        }
    }, []);

    const handleStudentLoginSuccess = (student: Student) => {
        setCurrentStudent(student);
        // localStorage is already set inside StudentLogin
    };

    const handleStudentLogout = () => {
        localStorage.removeItem('student_portal_id');
        setCurrentStudent(null);
        // Optional: Go back to ERP or stay in portal login? Stay in portal login usually.
        setMode('portal');
    };

    const switchToPortal = () => {
        setMode('portal');
        window.history.pushState(null, '', '/portal');
    };

    const switchToERP = () => {
        setMode('erp');
        window.history.pushState(null, '', '/');
    };

    if (mode === 'portal') {
        if (isLoadingStudent) {
            return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando perfil...</div>;
        }

        if (currentStudent) {
            return (
                <>
                    <InstallPrompt />
                    <StudentPortal student={currentStudent} onLogout={handleStudentLogout} />
                </>
            );
        }

        return (
            <div>
                <InstallPrompt />
                <StudentLogin onLoginSuccess={handleStudentLoginSuccess} />
                <div className="fixed bottom-4 right-4">
                    <button
                        onClick={switchToERP}
                        className="text-gray-500 hover:text-white text-xs underline"
                    >
                        Soy Administrador
                    </button>
                </div>
            </div>
        );
    }

    // Pass a prop to Login to allow switching to portal?
    // App -> Login. Since Login is inside App (conditionally), we might need to modify Login to have "Are you a student?" link.
    // For now, let's render App, and we will modify Login.tsx to include a link to ?mode=student.
    return (
        <>
            <InstallPrompt />
            <App />
        </>
    );
};

export default MainRouter;
