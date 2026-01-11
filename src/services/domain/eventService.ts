
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { DanceEvent } from '../../../types';

export const subscribeToEvents = (callback: (events: DanceEvent[]) => void): Unsubscribe => {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DanceEvent)));
    });
};

export const addEvent = async (event: Omit<DanceEvent, 'id'>) => {
    await addDoc(collection(db, 'events'), event);
};

export const updateEvent = async (event: DanceEvent) => {
    const { id, ...data } = event;
    await updateDoc(doc(db, 'events', id), data);
};

export const deleteEvent = async (eventId: string) => {
    await deleteDoc(doc(db, 'events', eventId));
};
