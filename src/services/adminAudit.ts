import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../config/firebase';

// Registro de las acciones de gestión de la dirección (Xenia) en el historial "Actividad profesores".
// Se engancha en los servicios (src/services/auditedServices.ts) para cubrir TODAS las vías de la app
// con un solo punto. Solo actúa si la sesión es la de la dirección; para cualquier otra cuenta no hace
// nada (ni lecturas extra). Nunca debe romper ni retrasar la operación: todo es best-effort.

export const DIRECTOR_EMAIL = 'info@xendance.space';

export const isDirectorSession = (): boolean => auth.currentUser?.email === DIRECTOR_EMAIL;

export type AdminActionKind =
    | 'student_added' | 'student_updated' | 'student_deleted' | 'student_restored' | 'student_purged' | 'students_imported'
    | 'instructor_added' | 'instructor_updated' | 'instructor_deleted' | 'instructor_restored' | 'instructor_purged'
    | 'class_added' | 'class_updated' | 'class_deleted' | 'class_restored' | 'class_purged'
    | 'event_added' | 'event_updated' | 'event_deleted' | 'event_restored' | 'event_purged'
    | 'nuptial_added' | 'nuptial_updated' | 'nuptial_deleted' | 'nuptial_restored' | 'nuptial_purged'
    | 'merch_item_added' | 'merch_item_updated' | 'merch_item_deleted' | 'merch_sale_added' | 'merch_sale_cancelled'
    | 'payment_added' | 'payment_updated' | 'payment_deleted' | 'payment_restored' | 'payment_purged' | 'payments_imported'
    | 'cost_added' | 'cost_updated' | 'cost_deleted' | 'cost_restored' | 'cost_purged' | 'costs_imported';

export const reportAdminAction = (kind: AdminActionKind, description: string): void => {
    if (!isDirectorSession() || !description) return;
    httpsCallable(functions, 'logAdminAction')({ kind, description }).catch(error => {
        console.error('[adminAudit] No se pudo registrar la acción:', error);
    });
};

// Nombre (o texto) de un documento, para describir "qué" se ha tocado cuando la operación solo trae el id
// (p. ej. borrar). Devuelve '' si no existe o falla la lectura.
export const readDocLabel = async (collectionName: string, id: string, fields: string[]): Promise<string> => {
    try {
        const snap = await getDoc(doc(db, collectionName, id));
        if (!snap.exists()) return '';
        const data = snap.data();
        return fields.map(f => (data[f] !== undefined && data[f] !== null ? String(data[f]) : '')).filter(Boolean).join(' · ');
    } catch {
        return '';
    }
};

const eur = (n: number | undefined): string => `${Math.round((n ?? 0) * 100) / 100} €`;
const quoted = (text: string | undefined): string => (text ? `«${text}»` : '');

// Textos de las acciones. Puros (sin red) para poder probarlos.
export const texts = {
    simple: (verb: string, noun: string, name: string) => `${verb} ${noun} ${quoted(name)}`.trim(),
    payment: (verb: string, amount: number | undefined, studentName: string, concept: string | undefined) =>
        `${verb}: ${eur(amount)}${studentName ? ` de ${quoted(studentName)}` : ''}${concept ? ` (${concept})` : ''}`,
    cost: (verb: string, amount: number | undefined, beneficiary: string | undefined, concept: string | undefined) =>
        `${verb}: ${eur(amount)}${beneficiary ? ` a ${quoted(beneficiary)}` : ''}${concept ? ` (${concept})` : ''}`,
    count: (verb: string, n: number, noun: string) => `${verb} ${n} ${noun}`,
};
