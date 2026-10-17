import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserRole } from '../services/domain/userProfileService';

export type StaffGate =
    | { status: 'loading' }
    | { status: 'anonymous' }
    | { status: 'admin' }
    | { status: 'teacher'; instructorId: string; email: string }
    | { status: 'noaccess'; email: string };

// Decide qué aplicación ve cada persona tras iniciar sesión: el ERP completo (las dos cuentas de
// administración, las mismas que firestore.rules), el panel de profesor (cuenta con el claim
// { role: 'Instructor', instructorId } que pone manageInstructorAccount) o una pantalla de "sin
// acceso". Antes, cualquier cuenta con sesión veía el ERP completo (aunque Firestore le negara las
// escrituras). El claim solo decide qué pantalla se muestra: los datos del profesor los protege el
// servidor (teacherOverview / teacherSaveAttendance comprueban su cuenta en cada llamada).
export const useStaffGate = (): StaffGate => {
    const [gate, setGate] = useState<StaffGate>({ status: 'loading' });

    useEffect(() => {
        let cancelled = false;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                if (!cancelled) setGate({ status: 'anonymous' });
                return;
            }
            const email = user.email || '';
            if (getUserRole(email) !== 'Instructor') {
                if (!cancelled) setGate({ status: 'admin' });
                return;
            }
            try {
                // true: fuerza token nuevo, para ver el claim recién asignado tras crear/restablecer el acceso.
                const token = await user.getIdTokenResult(true);
                const instructorId = typeof token.claims.instructorId === 'string' ? token.claims.instructorId : '';
                if (!cancelled) {
                    setGate(token.claims.role === 'Instructor' && instructorId
                        ? { status: 'teacher', instructorId, email }
                        : { status: 'noaccess', email });
                }
            } catch {
                if (!cancelled) setGate({ status: 'noaccess', email });
            }
        });
        return () => { cancelled = true; unsubscribe(); };
    }, []);

    return gate;
};
