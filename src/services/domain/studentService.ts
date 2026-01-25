
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, Unsubscribe } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Student } from '../../../types';

export const subscribeToStudents = (callback: (students: Student[]) => void): Unsubscribe => {
    const q = query(collection(db, 'students'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
};

import { getDocs, where } from 'firebase/firestore';

export const fetchStudents = async (): Promise<Student[]> => {
    const q = query(collection(db, 'students'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

export const findStudentByPhone = async (phone: string): Promise<Student | null> => {
    // Clean phone number (remove spaces, dashes)
    const cleanPhone = phone.replace(/\D/g, '');
    // We might need to store clean phones in DB to be robust, 
    // but for now let's assume exact match or try minimal cleaning locally if DB has raw strings.
    // Firestore simple query:
    const q = query(collection(db, 'students'), where('phone', '==', phone));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Student;
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
