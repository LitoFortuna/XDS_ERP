
import React, { useState, useEffect } from 'react';
import { requestNotificationPermission } from '../utils/notificationUtils';

const NotificationPrompter: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if we should show the prompt
        const checkPermission = async () => {
            if (!('Notification' in window)) return;

            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

            if (Notification.permission === 'default' && isStandalone) {
                // Only show if never asked before AND we are in PWA mode
                setIsVisible(true);
            }
        };

        checkPermission();
    }, []);

    const handleEnable = async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
            setIsVisible(false);
            // Logic for subscription would go here
            console.log('Notificaciones habilitadas');
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 border border-purple-500/50 rounded-2xl p-6 shadow-2xl shadow-purple-900/40">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Activa las Notificaciones</h3>
                        <p className="text-purple-200 text-sm mt-1">
                            Recibe avisos de cumpleaños, asistencias bajas y cambios importantes directamente en tu pantalla de inicio.
                        </p>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleEnable}
                                className="bg-white text-purple-900 px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-100 transition-colors shadow-lg"
                            >
                                Habilitar Ahora
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="bg-purple-800/50 text-purple-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-800 transition-colors"
                            >
                                Más tarde
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPrompter;
