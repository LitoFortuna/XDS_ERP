
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student, Instructor, DanceClass, Payment, Cost, NuptialDance, MerchandiseItem, MerchandiseSale, AttendanceRecord, DanceEvent } from '../../types';

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

export const updatePayment = async (payment: Payment) => {
  const { id, ...paymentData } = payment;
  const paymentDoc = doc(db, 'payments', id);
  await updateDoc(paymentDoc, paymentData);
};

export const deletePayment = async (paymentId: string) => {
  const paymentDoc = doc(db, 'payments', paymentId);
  await deleteDoc(paymentDoc);
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

// --- Merchandise Items ---

export const subscribeToMerchandiseItems = (callback: (items: MerchandiseItem[]) => void): Unsubscribe => {
  const q = query(collection(db, 'merchandiseItems'), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const items: MerchandiseItem[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as MerchandiseItem));
    callback(items);
  });
};

export const addMerchandiseItem = async (item: Omit<MerchandiseItem, 'id'>) => {
  await addDoc(collection(db, 'merchandiseItems'), item);
};

export const batchAddMerchandiseItems = async (items: Omit<MerchandiseItem, 'id'>[]) => {
  const batch = writeBatch(db);
  const itemsCollection = collection(db, 'merchandiseItems');
  items.forEach(item => {
    const docRef = doc(itemsCollection);
    batch.set(docRef, item);
  });
  await batch.commit();
};

export const updateMerchandiseItem = async (item: MerchandiseItem) => {
  const { id, ...itemData } = item;
  const itemDoc = doc(db, 'merchandiseItems', id);
  await updateDoc(itemDoc, itemData);
};

export const deleteMerchandiseItem = async (itemId: string) => {
  const itemDoc = doc(db, 'merchandiseItems', itemId);
  await deleteDoc(itemDoc);
};

// --- Merchandise Sales ---

export const subscribeToMerchandiseSales = (callback: (sales: MerchandiseSale[]) => void): Unsubscribe => {
  const q = query(collection(db, 'merchandiseSales'), orderBy('saleDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const sales: MerchandiseSale[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as MerchandiseSale));
    callback(sales);
  });
};

export const addMerchandiseSale = async (sale: Omit<MerchandiseSale, 'id'>) => {
  await addDoc(collection(db, 'merchandiseSales'), sale);
};

export const deleteMerchandiseSale = async (saleId: string) => {
  const saleDoc = doc(db, 'merchandiseSales', saleId);
  await deleteDoc(saleDoc);
};

// --- Attendance ---

export const subscribeToAttendance = (callback: (records: AttendanceRecord[]) => void): Unsubscribe => {
  const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const records: AttendanceRecord[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as AttendanceRecord));
    callback(records);
  });
};

export const addAttendance = async (record: Omit<AttendanceRecord, 'id'>) => {
  await addDoc(collection(db, 'attendance'), record);
};

export const updateAttendance = async (record: AttendanceRecord) => {
  const { id, ...recordData } = record;
  const recordDoc = doc(db, 'attendance', id);
  await updateDoc(recordDoc, recordData);
};

// --- Events ---

export const subscribeToEvents = (callback: (events: DanceEvent[]) => void): Unsubscribe => {
  const q = query(collection(db, 'events'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const events: DanceEvent[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as DanceEvent));
    callback(events);
  });
};

export const addEvent = async (event: Omit<DanceEvent, 'id'>) => {
  await addDoc(collection(db, 'events'), event);
};

export const updateEvent = async (event: DanceEvent) => {
  const { id, ...eventData } = event;
  const eventDoc = doc(db, 'events', id);
  await updateDoc(eventDoc, eventData);
};

export const deleteEvent = async (eventId: string) => {
  const eventDoc = doc(db, 'events', eventId);
  await deleteDoc(eventDoc);
};
