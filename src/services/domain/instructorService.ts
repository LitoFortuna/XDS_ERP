
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, Unsubscribe } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Instructor } from '../../../types';

export const subscribeToInstructors = (callback: (instructors: Instructor[]) => void): Unsubscribe => {
    const q = query(collection(db, 'instructors'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Instructor)));
    });
};

export const addInstructor = async (instructor: Omit<Instructor, 'id'>) => {
    await addDoc(collection(db, 'instructors'), instructor);
};

export const batchAddInstructors = async (instructors: Omit<Instructor, 'id'>[]) => {
    const batch = writeBatch(db);
    const colRef = collection(db, 'instructors');
    instructors.forEach(i => batch.set(doc(colRef), i));
    await batch.commit();
};

export const updateInstructor = async (instructor: Instructor) => {
    const { id, ...data } = instructor;
    await updateDoc(doc(db, 'instructors', id), data);
};

export const deleteInstructor = async (instructorId: string) => {
    await deleteDoc(doc(db, 'instructors', instructorId));
};
