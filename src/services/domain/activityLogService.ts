
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ActivityLog, UserRole } from '../../../types';

const COLLECTION_NAME = 'activityLogs';

/**
 * Logs an activity that should trigger a notification
 */
export const logActivity = async (log: Omit<ActivityLog, 'id' | 'timestamp' | 'read'>) => {
    try {
        await addDoc(collection(db, COLLECTION_NAME), {
            ...log,
            timestamp: new Date().toISOString(),
            read: false
        });
        console.log('[ActivityLog] Activity logged:', log.type, log.description);
    } catch (error) {
        console.error('[ActivityLog] Error logging activity:', error);
    }
};

/**
 * Subscribes to unread activity logs for a specific role
 */
export const subscribeToActivityLogs = (
    targetRole: UserRole,
    callback: (logs: ActivityLog[]) => void
) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('targetRole', '==', targetRole),
        where('read', '==', false),
        orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const logs: ActivityLog[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ActivityLog));
        callback(logs);
    });
};

/**
 * Marks an activity as read
 */
export const markActivityAsRead = async (logId: string) => {
    try {
        await updateDoc(doc(db, COLLECTION_NAME, logId), { read: true });
    } catch (error) {
        console.error('[ActivityLog] Error marking as read:', error);
    }
};

/**
 * Marks all activities as read for a specific role
 */
export const markAllActivitiesAsRead = async (logs: ActivityLog[]) => {
    try {
        await Promise.all(logs.map(log => log.id && markActivityAsRead(log.id)));
    } catch (error) {
        console.error('[ActivityLog] Error marking all as read:', error);
    }
};
