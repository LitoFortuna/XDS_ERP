
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { NuptialDance } from '../../../types';

export const subscribeToNuptialDances = (callback: (dances: NuptialDance[]) => void): Unsubscribe => {
    const q = query(collection(db, 'nuptialDances'), orderBy('weddingDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NuptialDance)));
    });
};

export const addNuptialDance = async (dance: Omit<NuptialDance, 'id'>) => {
    await addDoc(collection(db, 'nuptialDances'), dance);
};

export const updateNuptialDance = async (dance: NuptialDance) => {
    const { id, ...data } = dance;
    await updateDoc(doc(db, 'nuptialDances', id), data);
};

export const deleteNuptialDance = async (danceId: string) => {
    await deleteDoc(doc(db, 'nuptialDances', danceId));
};
