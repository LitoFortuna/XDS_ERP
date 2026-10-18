import { useEffect } from 'react';
import { clearBadge, closeAllNotifications } from '../utils/notificationUtils';

// Mantiene la insignia del icono (el número rojo) y la bandeja de notificaciones al día: mientras la
// app está abierta y a la vista no hay nada "sin ver", así que se borran al abrirla y cada vez que
// vuelve a primer plano. Antes la insignia solo se borraba si se abría PULSANDO la notificación;
// abrir la app desde el icono la dejaba con el número para siempre.
export const useBadgeSync = () => {
    useEffect(() => {
        const sync = () => {
            if (document.visibilityState !== 'visible') return;
            clearBadge();
            void closeAllNotifications();
        };
        sync();
        document.addEventListener('visibilitychange', sync);
        window.addEventListener('focus', sync);
        return () => {
            document.removeEventListener('visibilitychange', sync);
            window.removeEventListener('focus', sync);
        };
    }, []);
};
