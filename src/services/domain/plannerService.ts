import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, deleteField } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PlannerTask } from '../../../types';

// Colección propia del ERP ("calendarTasks"), con nombre distinto a "events"/"siteEvents" para no
// mezclarse con los eventos de competición del ERP ni con el contenido de la web pública, que
// comparten este mismo proyecto de Firebase (ver firestore.rules).
const COLLECTION = 'calendarTasks';

export const fetchPlannerTasks = async (): Promise<PlannerTask[]> => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PlannerTask));
};

// Firestore rechaza escribir `undefined` (aborta toda la escritura), así que los campos
// opcionales vacíos se omiten al crear y se borran de verdad (deleteField) al editar.
export const addPlannerTask = async (task: Omit<PlannerTask, 'id'>): Promise<string> => {
    const { description, dueDate, dueTime, completedAt, ...rest } = task;
    const payload: Record<string, unknown> = { ...rest };
    if (description) payload.description = description;
    if (dueDate) payload.dueDate = dueDate;
    if (dueTime) payload.dueTime = dueTime;
    if (completedAt) payload.completedAt = completedAt;
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return docRef.id;
};

export const updatePlannerTask = async (task: PlannerTask) => {
    const { id, description, dueDate, dueTime, completedAt, ...rest } = task;
    const data: Record<string, unknown> = { ...rest };
    data.description = description ? description : deleteField();
    data.dueDate = dueDate ? dueDate : deleteField();
    data.dueTime = dueTime ? dueTime : deleteField();
    data.completedAt = completedAt ? completedAt : deleteField();
    await updateDoc(doc(db, COLLECTION, id), data);
};

export const deletePlannerTask = async (taskId: string) => {
    await deleteDoc(doc(db, COLLECTION, taskId));
};
