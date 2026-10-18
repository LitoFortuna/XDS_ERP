
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAppStore } from '../store/useAppStore';
import { scheduleAttendanceReminder } from '../utils/notificationUtils';
import { DayOfWeek } from '../../types';
import { getUserProfile } from '../services/domain/userProfileService';
import { subscribeToActivityLogs } from '../services/domain/activityLogService';
import { getBirthdaysByDate, toIsoLocal } from '../utils/plannerUtils';

const BIRTHDAY_SHOWN_KEY = 'xds-birthday-modal-shown';

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
            const todayIso = toIsoLocal(today);
            const todayBirthdays = (getBirthdaysByDate(store.students, [today.getFullYear()]).get(todayIso) || [])
                .map(entry => entry.student);

            // El aviso sale una sola vez al día en este dispositivo (no en cada apertura o login);
            // el cumpleaños sigue visible todo el día en el Calendario.
            let alreadyShown = false;
            try { alreadyShown = localStorage.getItem(BIRTHDAY_SHOWN_KEY) === todayIso; } catch { /* sin almacenamiento */ }

            if (todayBirthdays.length > 0) {
                store.setBirthdaysToday(todayBirthdays);
                if (!alreadyShown) {
                    store.setBirthdayModalOpen(true);
                    try { localStorage.setItem(BIRTHDAY_SHOWN_KEY, todayIso); } catch { /* sin almacenamiento */ }
                }
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

        const todayIso = toIsoLocal(date);
        todayClasses.forEach(c => {
            // No se avisa de pasar lista si ya se pasó (comprobado al llegar la hora).
            scheduleAttendanceReminder(c.name, c.startTime, () =>
                useAppStore.getState().attendanceRecords.some(r => r.classId === c.id && r.date === todayIso));
        });
    }, [store.dataLoading, store.classes]);

    // Activity Log Subscription (SuperAdmin gets notified of Admin actions)
    useEffect(() => {
        if (!store.userProfile) return;

        // Only SuperAdmins receive activity notifications
        if (store.userProfile.role === 'SuperAdmin') {
            console.log('[ActivityLog] Subscribing to activity logs for SuperAdmin...');
            // Solo se actualiza la lista (campana). El aviso del sistema lo manda el servidor por push
            // (onNewActivityLog); crear aquí además un Notification local hacía que cada actividad sin leer
            // sonara dos veces y que, al abrir la app, salieran avisos viejos de golpe.
            const unsubscribe = subscribeToActivityLogs('SuperAdmin', (logs) => {
                store.setActivityLogs(logs);
            });
            return () => unsubscribe();
        }
    }, [store.userProfile]);
};
