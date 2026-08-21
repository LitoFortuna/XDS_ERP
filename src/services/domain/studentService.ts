
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, onSnapshot, query, orderBy, writeBatch, collectionGroup, Unsubscribe } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Student, StudentPrivateData } from '../../../types';

// DNI/IBAN live in students/{id}/private/sensitive, not on the public student doc — see
// firestore.rules for why (that doc is public-read for the Student Portal, this one isn't).
const privateDocRef = (studentId: string) => doc(db, 'students', studentId, 'private', 'sensitive');

export const getStudentPrivateData = async (studentId: string): Promise<StudentPrivateData | null> => {
    const snap = await getDoc(privateDocRef(studentId));
    return snap.exists() ? (snap.data() as StudentPrivateData) : null;
};

export const setStudentPrivateData = async (studentId: string, data: StudentPrivateData) => {
    await setDoc(privateDocRef(studentId), data, { merge: true });
};

// Admin-only bulk read across every student's private doc (e.g. for CSV export) — allowed by
// firestore.rules because collection-group queries are covered by the students/{id}/private rule.
export const fetchAllStudentPrivateData = async (): Promise<Record<string, StudentPrivateData>> => {
    const snapshot = await getDocs(collectionGroup(db, 'private'));
    const result: Record<string, StudentPrivateData> = {};
    snapshot.forEach(docSnap => {
        const studentId = docSnap.ref.parent.parent?.id;
        if (studentId) result[studentId] = docSnap.data() as StudentPrivateData;
    });
    return result;
};

export const batchSetStudentPrivateData = async (entries: { studentId: string; data: StudentPrivateData }[]) => {
    const batch = writeBatch(db);
    entries.forEach(({ studentId, data }) => {
        if (data.dni || data.iban) {
            batch.set(privateDocRef(studentId), data, { merge: true });
        }
    });
    await batch.commit();
};

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

export const addStudent = async (student: Omit<Student, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'students'), student);
    return docRef.id;
};

export const batchAddStudents = async (students: Omit<Student, 'id'>[]): Promise<string[]> => {
    const batch = writeBatch(db);
    const colRef = collection(db, 'students');
    const ids = students.map(s => {
        const ref = doc(colRef);
        batch.set(ref, s);
        return ref.id;
    });
    await batch.commit();
    return ids;
};

export const updateStudent = async (student: Student) => {
    const { id, ...data } = student;
    await updateDoc(doc(db, 'students', id), data);
};

export const deleteStudent = async (studentId: string) => {
    await deleteDoc(doc(db, 'students', studentId));
};
