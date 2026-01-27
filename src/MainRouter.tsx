
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
        const hostname = window.location.hostname;
        const path = window.location.pathname;

        // Domain-based routing logic
        const isAlumniDomain = hostname.includes('alumni.xendance.space');
        const isErpDomain = hostname.includes('erp.xendance.space');

        if (isAlumniDomain) {
            setMode('portal');
            document.title = 'Portal Alumnos | Xen Dance Space';
            updateMetaTag('apple-mobile-web-app-title', 'XDS Alumnos');
        } else if (isErpDomain) {
            setMode('erp');
            document.title = 'ERP Admin | Xen Dance Space';
            updateMetaTag('apple-mobile-web-app-title', 'XDS Admin');
        } else if (path === '/portal' || path === '/portal/') {
            // Fallback for current paths (especially for development or legacy links)
            setMode('portal');
            document.title = 'Portal Alumnos | Xen Dance Space';
            updateMetaTag('apple-mobile-web-app-title', 'XDS Alumno');
        } else {
            document.title = 'Xen Dance Space';
            updateMetaTag('apple-mobile-web-app-title', 'Xen Dance');
        }

        // Check local storage for persistent student session
        const storedStudentId = localStorage.getItem('student_portal_id');
        if (storedStudentId) {
            // Force portal mode if we have a student session
            setMode('portal');
            setIsLoadingStudent(true);
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
    };

    const handleStudentLogout = () => {
        localStorage.removeItem('student_portal_id');
        setCurrentStudent(null);
        setMode('portal');
    };

    const switchToPortal = () => {
        setMode('portal');
        if (!window.location.hostname.includes('alumni')) {
            window.history.pushState(null, '', '/portal');
        }
    };

    const switchToERP = () => {
        setMode('erp');
        if (!window.location.hostname.includes('erp')) {
            window.history.pushState(null, '', '/');
        }
    };

    if (mode === 'portal') {
        if (isLoadingStudent) {
            if (isLoadingStudent) {
                return (
                    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                        <p className="mb-6 text-lg">Cargando perfil...</p>
                        <button
                            onClick={() => {
                                localStorage.removeItem('student_portal_id');
                                window.location.reload();
                            }}
                            className="text-gray-400 hover:text-white text-sm underline bg-transparent border-none cursor-pointer"
                        >
                            ¿Tarda mucho? Cancelar y salir
                        </button>
                        <InstallPrompt />
                    </div>
                );
            }
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

// Helper function to update meta tags dynamically
function updateMetaTag(name: string, content: string) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
}

export default MainRouter;
