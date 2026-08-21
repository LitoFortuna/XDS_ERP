
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAppStore } from '../store/useAppStore';
import { scheduleAttendanceReminder } from '../utils/notificationUtils';
import { DayOfWeek } from '../../types';
import { getUserProfile } from '../services/domain/userProfileService';
import { subscribeToActivityLogs } from '../services/domain/activityLogService';

export const useInitializeData = () => {
    const store = useAppStore();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            store.setUser(currentUser);
            store.setAuthLoading(false);
            if (!currentUser) {
                store.setDataLoading(true);
                store.setHasCheckedBirthdays(false);
                store.setUserProfile(null);
            } else {
                // Load user profile with role
                getUserProfile(currentUser.uid, currentUser.email || '').then(profile => {
                    store.setUserProfile(profile);
                    console.log('[Auth] User profile loaded:', profile.email, 'as', profile.role);
                });
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // All entity data (students, classes, events, attendance, etc.) is fetched on demand via
    // React Query hooks now — see App.tsx — instead of always-on Firestore listeners established
    // here regardless of which view the admin is actually on. Nothing left to wait for at this
    // level, so the loading screen just needs to know auth resolved.
    useEffect(() => {
        if (!store.user) return;
        store.setDataLoading(false);
    }, [store.user]);

    // Birthday check logic
    useEffect(() => {
        if (!store.dataLoading && store.students.length > 0 && !store.hasCheckedBirthdays) {
            const today = new Date();
            const todayMonth = today.getMonth();
            const todayDay = today.getDate();

            const todayBirthdays = store.students.filter(s => {
                if (!s.active || !s.birthDate) return false;
                const dob = new Date(s.birthDate);
                return dob.getDate() === todayDay && dob.getMonth() === todayMonth;
            });

            if (todayBirthdays.length > 0) {
                store.setBirthdaysToday(todayBirthdays);
                store.setBirthdayModalOpen(true);
            }
            store.setHasCheckedBirthdays(true);
        }
    }, [store.dataLoading, store.students, store.hasCheckedBirthdays]);

    // Attendance Reminder Scheduling
    useEffect(() => {
        if (store.dataLoading || store.classes.length === 0) return;

        const date = new Date();
        const days: DayOfWeek[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const todayDayName = days[date.getDay()];

        const todayClasses = store.classes.filter(c => c.days.includes(todayDayName));

        console.log(`[Reminders] Analizando ${todayClasses.length} clases de hoy para recordatorios...`);

        todayClasses.forEach(c => {
            scheduleAttendanceReminder(c.name, c.startTime);
        });
    }, [store.dataLoading, store.classes]);

    // Activity Log Subscription (SuperAdmin gets notified of Admin actions)
    useEffect(() => {
        if (!store.userProfile) return;

        // Only SuperAdmins receive activity notifications
        if (store.userProfile.role === 'SuperAdmin') {
            console.log('[ActivityLog] Subscribing to activity logs for SuperAdmin...');
            const unsubscribe = subscribeToActivityLogs('SuperAdmin', (logs) => {
                store.setActivityLogs(logs);

                // Show browser notification for new activities
                if (logs.length > 0 && Notification.permission === 'granted') {
                    const latestLog = logs[0];
                    new Notification('📣 Nueva Actividad en XDS ERP', {
                        body: latestLog.description,
                        icon: '/android-chrome-192x192.png'
                    });
                }
            });
            return () => unsubscribe();
        }
    }, [store.userProfile]);
};
