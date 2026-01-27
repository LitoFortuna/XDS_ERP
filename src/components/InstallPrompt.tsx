
import React, { useEffect, useState } from 'react';

export const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(isStandaloneMode);

        if (isStandaloneMode) return;

        // Android / Desktop Chrome
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // iOS Detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
            setShowIOSPrompt(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                setDeferredPrompt(null);
            });
        }
    };

    if (isStandalone) return null;

    if (deferredPrompt) {
        return (
            <div className="fixed bottom-20 left-4 right-4 bg-purple-900 border border-purple-500 rounded-xl p-4 shadow-2xl z-50 flex items-center justify-between animate-fade-in-up">
                <div className="flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-lg">
                        <img src="/pwa-192x192.png" alt="App Icon" className="w-8 h-8 rounded-md" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Instalar App</h3>
                        <p className="text-purple-200 text-xs">Acceso rápido y offline</p>
                    </div>
                </div>
                <button
                    onClick={handleInstallClick}
                    className="bg-white text-purple-900 text-xs font-bold px-4 py-2 rounded-full hover:bg-purple-100 transition-colors"
                >
                    Instalar
                </button>
            </div>
        );
    }

    if (showIOSPrompt) {
        // Simple banner for iOS users users can dismiss
        // For now, we only show it if we haven't dismissed it in this session? 
        // Or just let it be there until installed (detected by standalone)

        // Let's check local storage to not annoy
        // const hasSeenPrompt = localStorage.getItem('iosInstallPromptSeen');
        // if (hasSeenPrompt) return null;

        return (
            <div className="fixed bottom-24 left-4 right-4 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-2xl z-50 animate-fade-in-up">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-sm mb-1">Instalar en iPhone/iPad</h3>
                        <p className="text-gray-300 text-xs mb-2 leading-relaxed">
                            1. Pulsa <strong>...</strong> (abajo derecha) y luego <strong>Compartir</strong>
                            <br />
                            2. Dale a <strong>Más...</strong> si no sale, y busca <strong>"Añadir a inicio"</strong>
                        </p>
                    </div>
                    <button
                        onClick={() => setShowIOSPrompt(false)}
                        className="text-gray-500 hover:text-white p-1"
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    return null;
};
