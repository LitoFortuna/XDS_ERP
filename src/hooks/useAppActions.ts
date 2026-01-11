
import { useAppStore } from '../store/useAppStore';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { View, Student, Instructor, DanceClass, Payment, Cost, NuptialDance, DanceEvent, MerchandiseItem, MerchandiseSale, AttendanceRecord } from '../../types';
import {
    addStudent as addStudentToDb,
    updateStudent as updateStudentInDb,
    deleteStudent as deleteStudentFromDb,
    addInstructor as addInstructorToDb,
    updateInstructor as updateInstructorInDb,
    deleteInstructor as deleteInstructorFromDb,
    addClass as addClassToDb,
    updateClass as updateClassInDb,
    deleteClass as deleteClassFromDb,
    addPayment as addPaymentToDb,
    updatePayment as updatePaymentInDb,
    deletePayment as deletePaymentFromDb,
    addCost as addCostToDb,
    updateCost as updateCostInDb,
    deleteCost as deleteCostFromDb,
    addNuptialDance as addNuptialDanceToDb,
    updateNuptialDance as updateNuptialDanceInDb,
    deleteNuptialDance as deleteNuptialDanceFromDb,
    addEvent as addEventToDb,
    updateEvent as updateEventInDb,
    deleteEvent as deleteEventFromDb,
    addMerchandiseItem as addMerchandiseItemToDb,
    updateMerchandiseItem as updateMerchandiseItemInDb,
    deleteMerchandiseItem as deleteMerchandiseItemFromDb,
    addMerchandiseSale as addMerchandiseSaleToDb,
    deleteMerchandiseSale as deleteMerchandiseSaleFromDb,
    addAttendance as addAttendanceToDb,
    updateAttendance as updateAttendanceInDb,
} from '../services/firestoreService';

export const useAppActions = () => {
    const {
        setCurrentView,
        students,
        classes,
        merchandiseItems,
    } = useAppStore();

    const addStudent = async (student: Omit<Student, 'id'>) => {
        await addStudentToDb({
            ...student,
            enrollmentDate: student.enrollmentDate || new Date().toISOString().split('T')[0],
            monthlyFee: student.monthlyFee || 19,
            paymentMethod: student.paymentMethod || 'Efectivo',
            enrolledClassIds: student.enrolledClassIds || [],
        });
    };

    const updateStudent = async (updatedStudent: Student) => {
        await updateStudentInDb(updatedStudent);
    };

    const deleteStudent = async (studentId: string) => {
        await deleteStudentFromDb(studentId);
    };

    const addInstructor = async (instructor: Omit<Instructor, 'id'>) => {
        await addInstructorToDb({
            ...instructor,
            active: instructor.active !== undefined ? instructor.active : true,
            hireDate: instructor.hireDate || new Date().toISOString().split('T')[0],
        });
    };

    const updateInstructor = async (updatedInstructor: Instructor) => {
        await updateInstructorInDb(updatedInstructor);
    };

    const deleteInstructor = async (instructorId: string) => {
        const isAssigned = classes.some(c => c.instructorId === instructorId);
        if (isAssigned) {
            alert('Este profesor está asignado a clases. Por favor, reasigna esas clases antes de eliminarlo.');
            return;
        }
        await deleteInstructorFromDb(instructorId);
    };

    const addClass = async (danceClass: Omit<DanceClass, 'id'>) => {
        await addClassToDb(danceClass);
    };

    const updateClass = async (updatedClass: DanceClass) => {
        await updateClassInDb(updatedClass);
    };

    const deleteClass = async (classId: string) => {
        const studentsToUpdate = students.filter(s => s.enrolledClassIds?.includes(classId));
        const updatePromises = studentsToUpdate.map(student => {
            const updatedStudent = {
                ...student,
                enrolledClassIds: student.enrolledClassIds.filter(id => id !== classId)
            };
            return updateStudentInDb(updatedStudent);
        });
        await Promise.all(updatePromises);
        await deleteClassFromDb(classId);
    };

    const addPayment = async (payment: Omit<Payment, 'id'>) => {
        await addPaymentToDb(payment);
    };

    const updatePayment = async (payment: Payment) => {
        await updatePaymentInDb(payment);
    };

    const deletePayment = async (paymentId: string) => {
        await deletePaymentFromDb(paymentId);
    };

    const addCost = async (cost: Omit<Cost, 'id'>) => {
        await addCostToDb(cost);
    };

    const updateCost = async (updatedCost: Cost) => {
        await updateCostInDb(updatedCost);
    };

    const deleteCost = async (costId: string) => {
        await deleteCostFromDb(costId);
    };

    const addNuptialDance = async (dance: Omit<NuptialDance, 'id'>) => {
        await addNuptialDanceToDb(dance);
    };

    const updateNuptialDance = async (updatedDance: NuptialDance) => {
        await updateNuptialDanceInDb(updatedDance);
    };

    const deleteNuptialDance = async (danceId: string) => {
        await deleteNuptialDanceFromDb(danceId);
    };

    const addEvent = async (event: Omit<DanceEvent, 'id'>) => {
        await addEventToDb(event);
    };

    const updateEvent = async (event: DanceEvent) => {
        await updateEventInDb(event);
    };

    const deleteEvent = async (eventId: string) => {
        await deleteEventFromDb(eventId);
    };

    const addMerchandiseItem = async (item: Omit<MerchandiseItem, 'id'>) => {
        await addMerchandiseItemToDb(item);
    };

    const updateMerchandiseItem = async (item: MerchandiseItem) => {
        await updateMerchandiseItemInDb(item);
    };

    const deleteMerchandiseItem = async (itemId: string) => {
        await deleteMerchandiseItemFromDb(itemId);
    };

    const addMerchandiseSale = async (sale: Omit<MerchandiseSale, 'id'>) => {
        const itemSold = merchandiseItems.find(item => item.id === sale.itemId);
        if (!itemSold || itemSold.stock < sale.quantity) {
            alert('No hay suficiente stock para realizar esta venta.');
            return;
        }
        await addMerchandiseSaleToDb(sale);
        await updateMerchandiseItemInDb({ ...itemSold, stock: itemSold.stock - sale.quantity });
    };

    const deleteMerchandiseSale = async (sale: MerchandiseSale) => {
        await deleteMerchandiseSaleFromDb(sale.id);
        const itemSold = merchandiseItems.find(item => item.id === sale.itemId);
        if (itemSold) {
            await updateMerchandiseItemInDb({ ...itemSold, stock: itemSold.stock + sale.quantity });
        }
    };

    const saveAttendance = async (record: Omit<AttendanceRecord, 'id'> | AttendanceRecord) => {
        if ('id' in record) {
            await updateAttendanceInDb(record);
        } else {
            await addAttendanceToDb(record);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setCurrentView(View.DASHBOARD);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return {
        addStudent, updateStudent, deleteStudent,
        addInstructor, updateInstructor, deleteInstructor,
        addClass, updateClass, deleteClass,
        addPayment, updatePayment, deletePayment,
        addCost, updateCost, deleteCost,
        addNuptialDance, updateNuptialDance, deleteNuptialDance,
        addEvent, updateEvent, deleteEvent,
        addMerchandiseItem, updateMerchandiseItem, deleteMerchandiseItem,
        addMerchandiseSale, deleteMerchandiseSale,
        saveAttendance,
        handleLogout
    };
};
