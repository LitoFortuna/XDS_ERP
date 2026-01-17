
/**
 * Utility to manage Web Push Notifications and App Badging
 */

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones de escritorio');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

export const setBadge = (count: number) => {
    if ('setAppBadge' in navigator) {
        (navigator as any).setAppBadge(count).catch((error: any) => {
            console.error('Error setting badge:', error);
        });
    }
};

export const clearBadge = () => {
    if ('clearAppBadge' in navigator) {
        (navigator as any).clearAppBadge().catch((error: any) => {
            console.error('Error clearing badge:', error);
        });
    }
};

/**
 * Subscribes to push notifications (simplified for now)
 * In a production app, you would send this subscription to your backend
 */
export const subscribeToPush = async () => {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;

        // Check if subscription already exists
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) return existingSubscription;

        // This requires a VAPID public key from your push server
        // For now, we only show how it would be implemented
        /*
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'TU_VAPID_PUBLIC_KEY'
        });
        return subscription;
        */
        return null;
    }
    return null;
};
/**
 * Schedules a local notification for a class attendance reminder
 */
export const scheduleAttendanceReminder = async (className: string, startTime: string) => {
    if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;

    // Parse start time (HH:MM)
    const [hours, minutes] = startTime.split(':').map(Number);

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes + 5, 0, 0);

    // If time is already passed today, don't schedule or schedule for tomorrow
    // For simplicity, we only schedule if it's in the future today
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay > 0) {
        console.log(`[Notification] Programando recordatorio para ${className} en ${Math.round(delay / 60000)} min`);

        // Note: Real "scheduling" for web usually requires a backend push.
        // However, for the current session, we can use a timeout as a "live" reminder.
        setTimeout(() => {
            registration.showNotification('📝 Recordatorio de Asistencia', {
                body: `La clase de "${className}" empezó hace 5 minutos. No olvides pasar lista.`,
                icon: '/android-chrome-192x192.png',
                badge: '/android-chrome-192x192.png',
                tag: `attendance-${className}-${startTime}`,
                data: { url: '/attendance' }
            });
        }, delay);
    }
};
