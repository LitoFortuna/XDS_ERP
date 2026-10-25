import * as students from './domain/studentService';
import * as instructors from './domain/instructorService';
import * as classes from './domain/classService';
import * as finance from './domain/financeService';
import * as events from './domain/eventService';
import * as nuptial from './domain/nuptialService';
import * as merchandise from './domain/merchandiseService';
import { AdminActionKind, isDirectorSession, reportAdminAction, readDocLabel, texts } from './adminAudit';

// Versiones de los servicios de escritura que, además de hacer su trabajo, anotan en el historial de
// "Actividad profesores" lo que hace la dirección (Xenia). firestoreService.ts las exporta con el mismo
// nombre, así que TODAS las pantallas y hooks las usan sin cambiar nada más. Con cualquier otra cuenta
// (SuperAdmin) son exactamente la función original: no añaden lecturas ni llamadas.

type Fn<A extends unknown[], R> = (...args: A) => Promise<R>;

// Tras una operación con un objeto (alta/edición/importación): describe lo hecho a partir de los datos.
const afterItem = <I, R>(fn: Fn<[I], R>, kind: AdminActionKind, text: (item: I) => string | Promise<string>): Fn<[I], R> =>
    async (item: I) => {
        const result = await fn(item);
        if (isDirectorSession()) {
            void Promise.resolve(text(item)).then(t => reportAdminAction(kind, t)).catch(() => undefined);
        }
        return result;
    };

// Operación sobre un id (papelera, restaurar, borrar definitivamente): se lee el nombre ANTES (el
// documento puede dejar de existir) y se describe después de que haya salido bien.
const byId = <R>(fn: Fn<[string], R>, kind: AdminActionKind, collectionName: string, fields: string[], text: (label: string) => string): Fn<[string], R> =>
    async (id: string) => {
        const label = isDirectorSession() ? await readDocLabel(collectionName, id, fields) : '';
        const result = await fn(id);
        if (isDirectorSession()) reportAdminAction(kind, text(label));
        return result;
    };

const studentName = (studentId: string) => readDocLabel('students', studentId, ['name']);

// ---------- Alumnas ----------
export const addStudent = afterItem(students.addStudent, 'student_added', s => texts.simple('Dio de alta a la alumna', '', s.name));
export const updateStudent = afterItem(students.updateStudent, 'student_updated', s => texts.simple('Editó la ficha de la alumna', '', s.name));
export const deleteStudent = byId(students.deleteStudent, 'student_deleted', 'students', ['name'], l => texts.simple('Envió a la papelera a la alumna', '', l));
export const restoreStudent = byId(students.restoreStudent, 'student_restored', 'students', ['name'], l => texts.simple('Restauró a la alumna', '', l));
export const permanentlyDeleteStudent = byId(students.permanentlyDeleteStudent, 'student_purged', 'students', ['name'], l => texts.simple('Eliminó definitivamente a la alumna', '', l));
export const batchAddStudents = afterItem(students.batchAddStudents, 'students_imported', list => texts.count('Importó', list.length, 'alumnas'));

// ---------- Profesores ----------
export const addInstructor = afterItem(instructors.addInstructor, 'instructor_added', i => texts.simple('Dio de alta al profesor', '', i.name));
export const updateInstructor = afterItem(instructors.updateInstructor, 'instructor_updated', i => texts.simple('Editó la ficha del profesor', '', i.name));
export const deleteInstructor = byId(instructors.deleteInstructor, 'instructor_deleted', 'instructors', ['name'], l => texts.simple('Envió a la papelera al profesor', '', l));
export const restoreInstructor = byId(instructors.restoreInstructor, 'instructor_restored', 'instructors', ['name'], l => texts.simple('Restauró al profesor', '', l));
export const permanentlyDeleteInstructor = byId(instructors.permanentlyDeleteInstructor, 'instructor_purged', 'instructors', ['name'], l => texts.simple('Eliminó definitivamente al profesor', '', l));

// ---------- Clases ----------
export const addClass = afterItem(classes.addClass, 'class_added', c => texts.simple('Creó la clase', '', c.name));
export const updateClass = afterItem(classes.updateClass, 'class_updated', c => texts.simple('Editó la clase', '', c.name));
export const deleteClass = byId(classes.deleteClass, 'class_deleted', 'classes', ['name'], l => texts.simple('Envió a la papelera la clase', '', l));
export const restoreClass = byId(classes.restoreClass, 'class_restored', 'classes', ['name'], l => texts.simple('Restauró la clase', '', l));
export const permanentlyDeleteClass = byId(classes.permanentlyDeleteClass, 'class_purged', 'classes', ['name'], l => texts.simple('Eliminó definitivamente la clase', '', l));

// ---------- Cobros ----------
export const addPayment = afterItem(finance.addPayment, 'payment_added', async p => texts.payment('Cobro registrado', p.amount, await studentName(p.studentId), p.concept));
export const updatePayment = afterItem(finance.updatePayment, 'payment_updated', async p => texts.payment('Cobro editado', p.amount, await studentName(p.studentId), p.concept));
export const deletePayment = byId(finance.deletePayment, 'payment_deleted', 'payments', ['amount', 'concept'], l => `Envió a la papelera un cobro: ${l}`);
export const restorePayment = byId(finance.restorePayment, 'payment_restored', 'payments', ['amount', 'concept'], l => `Restauró un cobro: ${l}`);
export const permanentlyDeletePayment = byId(finance.permanentlyDeletePayment, 'payment_purged', 'payments', ['amount', 'concept'], l => `Eliminó definitivamente un cobro: ${l}`);
export const batchAddPayments = afterItem(finance.batchAddPayments, 'payments_imported', list => texts.count('Registró', list.length, 'cobros (conciliación o importación)'));

// ---------- Gastos ----------
export const addCost = afterItem(finance.addCost, 'cost_added', c => texts.cost('Gasto registrado', c.amount, c.beneficiary, c.concept));
export const updateCost = afterItem(finance.updateCost, 'cost_updated', c => texts.cost('Gasto editado', c.amount, c.beneficiary, c.concept));
export const deleteCost = byId(finance.deleteCost, 'cost_deleted', 'costs', ['beneficiary', 'concept'], l => `Envió a la papelera un gasto: ${l}`);
export const restoreCost = byId(finance.restoreCost, 'cost_restored', 'costs', ['beneficiary', 'concept'], l => `Restauró un gasto: ${l}`);
export const permanentlyDeleteCost = byId(finance.permanentlyDeleteCost, 'cost_purged', 'costs', ['beneficiary', 'concept'], l => `Eliminó definitivamente un gasto: ${l}`);
export const batchAddCosts = afterItem(finance.batchAddCosts, 'costs_imported', list => texts.count('Importó', list.length, 'gastos'));

// ---------- Eventos ----------
export const addEvent = afterItem(events.addEvent, 'event_added', e => texts.simple('Creó el evento', '', e.name));
export const updateEvent = afterItem(events.updateEvent, 'event_updated', e => texts.simple('Editó el evento', '', e.name));
export const deleteEvent = byId(events.deleteEvent, 'event_deleted', 'events', ['name'], l => texts.simple('Envió a la papelera el evento', '', l));
export const restoreEvent = byId(events.restoreEvent, 'event_restored', 'events', ['name'], l => texts.simple('Restauró el evento', '', l));
export const permanentlyDeleteEvent = byId(events.permanentlyDeleteEvent, 'event_purged', 'events', ['name'], l => texts.simple('Eliminó definitivamente el evento', '', l));

// ---------- Bailes nupciales ----------
export const addNuptialDance = afterItem(nuptial.addNuptialDance, 'nuptial_added', d => texts.simple('Registró el baile nupcial de', '', d.coupleName));
export const updateNuptialDance = afterItem(nuptial.updateNuptialDance, 'nuptial_updated', d => texts.simple('Editó el baile nupcial de', '', d.coupleName));
export const deleteNuptialDance = byId(nuptial.deleteNuptialDance, 'nuptial_deleted', 'nuptialDances', ['coupleName'], l => texts.simple('Envió a la papelera el baile nupcial de', '', l));
export const restoreNuptialDance = byId(nuptial.restoreNuptialDance, 'nuptial_restored', 'nuptialDances', ['coupleName'], l => texts.simple('Restauró el baile nupcial de', '', l));
export const permanentlyDeleteNuptialDance = byId(nuptial.permanentlyDeleteNuptialDance, 'nuptial_purged', 'nuptialDances', ['coupleName'], l => texts.simple('Eliminó definitivamente el baile nupcial de', '', l));

// ---------- Merchandising ----------
export const addMerchandiseItem = afterItem(merchandise.addMerchandiseItem, 'merch_item_added', i => texts.simple('Añadió el artículo', '', i.name));
export const updateMerchandiseItem = afterItem(merchandise.updateMerchandiseItem, 'merch_item_updated', i => texts.simple('Editó el artículo', '', i.name));
export const deleteMerchandiseItem = byId(merchandise.deleteMerchandiseItem, 'merch_item_deleted', 'merchandiseItems', ['name'], l => texts.simple('Eliminó el artículo', '', l));
export const executeMerchandiseSale = afterItem(merchandise.executeMerchandiseSale, 'merch_sale_added', async s =>
    `Venta registrada: ${s.quantity} × ${s.itemName}${s.studentId ? ` a ${await studentName(s.studentId)}` : ''} (${s.totalAmount} €)`);
export const cancelMerchandiseSale = afterItem(merchandise.cancelMerchandiseSale, 'merch_sale_cancelled', s => `Venta cancelada: ${s.quantity} × ${s.itemName} (${s.totalAmount} €)`);
