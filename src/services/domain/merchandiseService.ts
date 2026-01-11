
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, Unsubscribe } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { MerchandiseItem, MerchandiseSale } from '../../../types';

// --- Items ---
export const subscribeToMerchandiseItems = (callback: (items: MerchandiseItem[]) => void): Unsubscribe => {
    const q = query(collection(db, 'merchandiseItems'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MerchandiseItem)));
    });
};

export const addMerchandiseItem = async (item: Omit<MerchandiseItem, 'id'>) => {
    await addDoc(collection(db, 'merchandiseItems'), item);
};

export const updateMerchandiseItem = async (item: MerchandiseItem) => {
    const { id, ...data } = item;
    await updateDoc(doc(db, 'merchandiseItems', id), data);
};

export const deleteMerchandiseItem = async (itemId: string) => {
    await deleteDoc(doc(db, 'merchandiseItems', itemId));
};

export const batchAddMerchandiseItems = async (items: Omit<MerchandiseItem, 'id'>[]) => {
    const batch = writeBatch(db);
    const colRef = collection(db, 'merchandiseItems');
    items.forEach(i => batch.set(doc(colRef), i));
    await batch.commit();
};

// --- Sales ---
export const subscribeToMerchandiseSales = (callback: (sales: MerchandiseSale[]) => void): Unsubscribe => {
    const q = query(collection(db, 'merchandiseSales'), orderBy('saleDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MerchandiseSale)));
    });
};

export const addMerchandiseSale = async (sale: Omit<MerchandiseSale, 'id'>) => {
    await addDoc(collection(db, 'merchandiseSales'), sale);
};

export const deleteMerchandiseSale = async (saleId: string) => {
    await deleteDoc(doc(db, 'merchandiseSales', saleId));
};
