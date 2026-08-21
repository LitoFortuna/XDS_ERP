
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAppStore } from '../store/useAppStore';
import {
    subscribeToStudents,
    subscribeToInstructors,
    subscribeToClasses,
    subscribeToPayments,
    subscribeToCosts,
    subscribeToNuptialDances,
    subscribeToEvents,
    subscribeToMerchandiseItems,
    subscribeToMerchandiseSales,
    subscribeToAttendance,
} from '../services/firestoreService';
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

    useEffect(() => {
        if (!store.user) return;

        // dataLoading flips to false once every subscription below has delivered its first
        // snapshot, instead of a fixed timer — with the IndexedDB persistence cache this is
        // usually near-instant, but a blind 1.5s delay made every admin wait that long even
        // when data was already sitting in cache. The safety timer is just a fallback in case
        // one listener never resolves (offline, permission error, etc.), so the loading screen
        // can't get stuck forever.
        let resolvedCount = 0;
        let settled = false;
        const TOTAL_SUBSCRIPTIONS = 5;

        const markResolved = () => {
            if (settled) return;
            resolvedCount++;
            if (resolvedCount >= TOTAL_SUBSCRIPTIONS) {
                settled = true;
                store.setDataLoading(false);
            }
        };

        const unsubscribers = [
            // subscribeToStudents(store.setStudents), // Migrated to React Query
            // subscribeToInstructors(store.setInstructors), // Migrated to React Query
            // subscribeToClasses(store.setClasses), // Migrated to React Query
            // subscribeToPayments(store.setPayments), // Migrated to React Query
            // subscribeToCosts(store.setCosts), // Migrated to React Query
            subscribeToNuptialDances((data) => { store.setNuptialDances(data); markResolved(); }),
            subscribeToEvents((data) => { store.setEvents(data); markResolved(); }),
            subscribeToMerchandiseItems((data) => { store.setMerchandiseItems(data); markResolved(); }),
            subscribeToMerchandiseSales((data) => { store.setMerchandiseSales(data); markResolved(); }),
            subscribeToAttendance((data) => { store.setAttendanceRecords(data); markResolved(); }),
        ];

        const safetyTimer = setTimeout(() => {
            settled = true;
            store.setDataLoading(false);
        }, 5000);

        return () => {
            unsubscribers.forEach(unsub => unsub());
            clearTimeout(safetyTimer);
        };
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
