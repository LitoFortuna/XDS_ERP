
export * from './domain/studentService';
export * from './domain/instructorService';
export * from './domain/classService';
export * from './domain/financeService';
export * from './domain/merchandiseService';
export * from './domain/attendanceService';
export * from './domain/eventService';
export * from './domain/nuptialService';

// Las escrituras de gestión pasan por auditedServices (anotan lo que hace la dirección en el historial de
// actividad). Una exportación explícita tiene prioridad sobre el `export *` de arriba.
export {
    addStudent, updateStudent, deleteStudent, restoreStudent, permanentlyDeleteStudent, batchAddStudents,
    addInstructor, updateInstructor, deleteInstructor, restoreInstructor, permanentlyDeleteInstructor,
    addClass, updateClass, deleteClass, restoreClass, permanentlyDeleteClass,
    addPayment, updatePayment, deletePayment, restorePayment, permanentlyDeletePayment, batchAddPayments,
    addCost, updateCost, deleteCost, restoreCost, permanentlyDeleteCost, batchAddCosts,
    addEvent, updateEvent, deleteEvent, restoreEvent, permanentlyDeleteEvent,
    addNuptialDance, updateNuptialDance, deleteNuptialDance, restoreNuptialDance, permanentlyDeleteNuptialDance,
    addMerchandiseItem, updateMerchandiseItem, deleteMerchandiseItem, executeMerchandiseSale, cancelMerchandiseSale,
} from './auditedServices';
