import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.API_KEY!,
  authDomain: "xen-dance-erp.firebaseapp.com",
  projectId: "xen-dance-erp",
  storageBucket: "xen-dance-erp.firebasestorage.app",
  messagingSenderId: "958181098277",
  appId: "1:958181098277:web:8af680b63c7f223fec90cc"
};

let db: Firestore;

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // Initialize Cloud Firestore and get a reference to the service
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // This error often means Firestore has not been enabled for the project
  // in the Firebase console.
  throw new Error(
    'Failed to initialize Firestore. Please ensure your Firebase project configuration in `src/config/firebase.ts` is correct and that you have enabled the Cloud Firestore API in the Firebase Console for that project.'
  );
}

export { db };