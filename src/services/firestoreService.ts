import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student, Instructor, DanceClass, Payment, Cost, NuptialDance } from '../../types';

// --- Students ---

export const subscribeToStudents = (callback: (students: Student[]) => void): Unsubscribe => {
  const q = query(collection(db, 'students'), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const students: Student[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Student));
    callback(students);
  });
};

export const addStudent = async (student: Omit<Student, 'id'>) => {
  await addDoc(collection(db, 'students'), student);
};

export const batchAddStudents = async (students: Omit<Student, 'id'>[]) => {
  const batch = writeBatch(db);
  const studentsCollection = collection(db, 'students');
  students.forEach(student => {
    const docRef = doc(studentsCollection);
    batch.set(docRef, student);
  });
  await batch.commit();
};

export const updateStudent = async (student: Student) => {
  const { id, ...studentData } = student;
  const studentDoc = doc(db, 'students', id);
  await updateDoc(studentDoc, studentData);
};

export const deleteStudent = async (studentId: string) => {
  const studentDoc = doc(db, 'students', studentId);
  await deleteDoc(studentDoc);
};

// --- Instructors ---

export const subscribeToInstructors = (callback: (instructors: Instructor[]) => void): Unsubscribe => {
  const q = query(collection(db, 'instructors'), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const instructors: Instructor[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Instructor));
    callback(instructors);
  });
};

export const addInstructor = async (instructor: Omit<Instructor, 'id'>) => {
  await addDoc(collection(db, 'instructors'), instructor);
};

export const batchAddInstructors = async (instructors: Omit<Instructor, 'id'>[]) => {
  const batch = writeBatch(db);
  const instructorsCollection = collection(db, 'instructors');
  instructors.forEach(instructor => {
    const docRef = doc(instructorsCollection);
    batch.set(docRef, instructor);
  });
  await batch.commit();
};

export const updateInstructor = async (instructor: Instructor) => {
  const { id, ...instructorData } = instructor;
  const instructorDoc = doc(db, 'instructors', id);
  await updateDoc(instructorDoc, instructorData);
};

export const deleteInstructor = async (instructorId: string) => {
  const instructorDoc = doc(db, 'instructors', instructorId);
  await deleteDoc(instructorDoc);
};

// --- Classes ---

export const subscribeToClasses = (callback: (classes: DanceClass[]) => void): Unsubscribe => {
  const q = query(collection(db, 'classes'), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const classes: DanceClass[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as DanceClass));
    callback(classes);
  });
};

export const addClass = async (danceClass: Omit<DanceClass, 'id'>) => {
  await addDoc(collection(db, 'classes'), danceClass);
};

export const batchAddClasses = async (classes: Omit<DanceClass, 'id'>[]) => {
  const batch = writeBatch(db);
  const classesCollection = collection(db, 'classes');
  classes.forEach(danceClass => {
    const docRef = doc(classesCollection);
    batch.set(docRef, danceClass);
  });
  await batch.commit();
};

export const updateClass = async (danceClass: DanceClass) => {
  const { id, ...classData } = danceClass;
  const classDoc = doc(db, 'classes', id);
  await updateDoc(classDoc, classData);
};

export const deleteClass = async (classId: string) => {
  const classDoc = doc(db, 'classes', classId);
  await deleteDoc(classDoc);
};

// --- Payments ---

export const subscribeToPayments = (callback: (payments: Payment[]) => void): Unsubscribe => {
  const q = query(collection(db, 'payments'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const payments: Payment[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Payment));
    callback(payments);
  });
};

export const addPayment = async (payment: Omit<Payment, 'id'>) => {
  await addDoc(collection(db, 'payments'), payment);
};

export const batchAddPayments = async (payments: Omit<Payment, 'id'>[]) => {
  const batch = writeBatch(db);
  const paymentsCollection = collection(db, 'payments');
  payments.forEach(payment => {
    const docRef = doc(paymentsCollection);
    batch.set(docRef, payment);
  });
  await batch.commit();
};

// --- Costs ---

export const subscribeToCosts = (callback: (costs: Cost[]) => void): Unsubscribe => {
  const q = query(collection(db, 'costs'), orderBy('paymentDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const costs: Cost[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Cost));
    callback(costs);
  });
};

export const addCost = async (cost: Omit<Cost, 'id'>) => {
  await addDoc(collection(db, 'costs'), cost);
};

export const batchAddCosts = async (costs: Omit<Cost, 'id'>[]) => {
  const batch = writeBatch(db);
  const costsCollection = collection(db, 'costs');
  costs.forEach(cost => {
    const docRef = doc(costsCollection);
    batch.set(docRef, cost);
  });
  await batch.commit();
};

export const updateCost = async (cost: Cost) => {
  const { id, ...costData } = cost;
  const costDoc = doc(db, 'costs', id);
  await updateDoc(costDoc, costData);
};

export const deleteCost = async (costId: string) => {
  const costDoc = doc(db, 'costs', costId);
  await deleteDoc(costDoc);
};

// --- Nuptial Dances ---

export const subscribeToNuptialDances = (callback: (dances: NuptialDance[]) => void): Unsubscribe => {
  const q = query(collection(db, 'nuptialDances'), orderBy('weddingDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const dances: NuptialDance[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as NuptialDance));
    callback(dances);
  });
};

export const addNuptialDance = async (dance: Omit<NuptialDance, 'id'>) => {
  await addDoc(collection(db, 'nuptialDances'), dance);
};

export const updateNuptialDance = async (dance: NuptialDance) => {
  const { id, ...danceData } = dance;
  const danceDoc = doc(db, 'nuptialDances', id);
  await updateDoc(danceDoc, danceData);
};

export const deleteNuptialDance = async (danceId: string) => {
  const danceDoc = doc(db, 'nuptialDances', danceId);
  await deleteDoc(danceDoc);
};
