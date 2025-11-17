import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore, FirestoreError } from 'firebase/firestore';

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
  if (!firebaseConfig.apiKey) {
    throw new Error("La variable de entorno API_KEY de Firebase no está configurada. Por favor, asegúrate de que esté disponible.");
  }
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error: any) {
  let friendlyMessage = 'Error al inicializar Firebase. Revisa la consola para más detalles.';
  
  if (error instanceof Error) {
      if (error.message.includes("API key not valid")) {
          friendlyMessage = 'Error de Firebase: La API Key proporcionada no es válida. Revisa tu configuración.';
      } else if (error.message.includes("project not found")) {
          friendlyMessage = 'Error de Firebase: Proyecto no encontrado. Verifica que el `projectId` en tu configuración sea correcto.';
      }
  }

  if (error.code === 'failed-precondition' || (error instanceof Error && error.message.toLowerCase().includes('firestore'))) {
      friendlyMessage = 'Error de Firestore: No se pudo conectar. Asegúrate de que la API de Cloud Firestore esté habilitada en la Consola de Firebase para este proyecto.';
  }

  console.error("FALLO EN LA INICIALIZACIÓN DE FIREBASE:", error);
  
  // Display the error in the UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: #fecaca; background-color: #1f2937; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h1 style="font-size: 1.5rem; font-weight: bold; color: #f87171;">Error de Conexión</h1>
        <p style="margin-top: 1rem; color: #fca5a5;">${friendlyMessage}</p>
        <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #9ca3af;">Por favor, contacta al soporte técnico si el problema persiste.</p>
      </div>
    `;
  }

  throw new Error(friendlyMessage);
}

export { db };