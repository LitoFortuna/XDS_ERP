
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

export const useInitializeData = () => {
    const store = useAppStore();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            store.setUser(currentUser);
            store.setAuthLoading(false);
            if (!currentUser) {
                store.setDataLoading(true);
                store.setHasCheckedBirthdays(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!store.user) return;

        const unsubscribers = [
            subscribeToStudents(store.setStudents),
            subscribeToInstructors(store.setInstructors),
            subscribeToClasses(store.setClasses),
            subscribeToPayments(store.setPayments),
            subscribeToCosts(store.setCosts),
            subscribeToNuptialDances(store.setNuptialDances),
            subscribeToEvents(store.setEvents),
            subscribeToMerchandiseItems(store.setMerchandiseItems),
            subscribeToMerchandiseSales(store.setMerchandiseSales),
            subscribeToAttendance(store.setAttendanceRecords),
        ];

        const timer = setTimeout(() => {
            store.setDataLoading(false);
        }, 1500);

        return () => {
            unsubscribers.forEach(unsub => unsub());
            clearTimeout(timer);
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
};
