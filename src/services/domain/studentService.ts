
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, Unsubscribe } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Student } from '../../../types';

export const subscribeToStudents = (callback: (students: Student[]) => void): Unsubscribe => {
    const q = query(collection(db, 'students'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
};

export const addStudent = async (student: Omit<Student, 'id'>) => {
    await addDoc(collection(db, 'students'), student);
};

export const batchAddStudents = async (students: Omit<Student, 'id'>[]) => {
    const batch = writeBatch(db);
    const colRef = collection(db, 'students');
    students.forEach(s => batch.set(doc(colRef), s));
    await batch.commit();
};

export const updateStudent = async (student: Student) => {
    const { id, ...data } = student;
    await updateDoc(doc(db, 'students', id), data);
};

export const deleteStudent = async (studentId: string) => {
    await deleteDoc(doc(db, 'students', studentId));
};
