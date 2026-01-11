
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AttendanceRecord } from '../../../types';

export const subscribeToAttendance = (callback: (records: AttendanceRecord[]) => void): Unsubscribe => {
    const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    });
};

export const addAttendance = async (record: Omit<AttendanceRecord, 'id'>) => {
    await addDoc(collection(db, 'attendance'), record);
};

export const updateAttendance = async (record: AttendanceRecord) => {
    const { id, ...data } = record;
    await updateDoc(doc(db, 'attendance', id), data);
};
