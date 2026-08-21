import firebase from 'firebase/compat/app';
import { getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAc4FNxMzvDz5NrfhPSgTdb2gDhq4tRI0E",
  authDomain: "xen-dance-erp.firebaseapp.com",
  projectId: "xen-dance-erp",
  storageBucket: "xen-dance-erp.firebasestorage.app",
  messagingSenderId: "958181098277",
  appId: "1:958181098277:web:8af680b63c7f223fec90cc"
};

firebase.initializeApp(firebaseConfig);
// getApp() returns the underlying modular FirebaseApp registered by the compat call above —
// passing the compat wrapper itself (as the `as any` casts used to) works for firestore/auth
// but the functions component isn't registered against it, so getFunctions() throws
// "Service functions is not available". Using the real modular app avoids that.
const app = getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.log('Persistence failed: Multiple tabs open');
  } else if (err.code == 'unimplemented') {
    console.log('Persistence is not available in this browser');
  }
});

export { db, auth, functions };