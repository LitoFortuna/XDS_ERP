
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
