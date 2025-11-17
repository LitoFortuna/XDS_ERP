import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAc4FNxMzvDz5NrfhPSgTdb2gDhq4tRI0E",
  authDomain: "xen-dance-erp.firebaseapp.com",
  projectId: "xen-dance-erp",
  storageBucket: "xen-dance-erp.firebasestorage.app",
  messagingSenderId: "958181098277",
  appId: "1:958181098277:web:8af680b63c7f223fec90cc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };