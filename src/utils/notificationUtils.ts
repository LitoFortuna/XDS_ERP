
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
 * Subscribes to push notifications
 * Stores the subscription in the user's profile for the server to use
 */
export const subscribeToPush = async (userId: string): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push] Push notifications not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if subscription already exists
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Import VAPID key
            const { VAPID_PUBLIC_KEY } = await import('../config/vapidKeys');

            // Convert VAPID key to Uint8Array
            const urlBase64ToUint8Array = (base64String: string) => {
                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                const base64 = (base64String + padding)
                    .replace(/-/g, '+')
                    .replace(/_/g, '/');
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
            };

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log('[Push] New subscription created');
        }

        // Save subscription to user's profile in Firestore
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../config/firebase');

        await setDoc(doc(db, 'userProfiles', userId), {
            pushSubscription: JSON.stringify(subscription)
        }, { merge: true });

        console.log('[Push] Subscription saved to profile');
        return subscription;

    } catch (error) {
        console.error('[Push] Error subscribing:', error);
        return null;
    }
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
