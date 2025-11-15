import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAc4FNxMzvDz5NrfhPSgTdb2gDhq4tRI0E",
  authDomain: "xen-dance-erp.firebaseapp.com",
  projectId: "xen-dance-erp",
  storageBucket: "xen-dance-erp.firebasestorage.app",
  messagingSenderId: "958181098277",
  appId: "1:958181098277:web:8af680b63c7f223fec90cc"
};

let app: FirebaseApp;
let db: Firestore;

// Esta inicialización perezosa asegura que Firebase se inicialice solo cuando se necesita
// y previene posibles condiciones de carrera o problemas de carga de módulos.
export const getDb = (): Firestore => {
  if (!db) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
};
