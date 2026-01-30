
import { useAppStore } from '../store/useAppStore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
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
    executeMerchandiseSale,
    cancelMerchandiseSale,
    addAttendance as addAttendanceToDb,
    updateAttendance as updateAttendanceInDb,
} from '../services/firestoreService';
import { logActivity } from '../services/domain/activityLogService';
import { updateProgressAfterAttendance } from '../../services/progressService';
import { useQueryClient } from '@tanstack/react-query';

export const useAppActions = () => {
    const queryClient = useQueryClient();
    const {
        setCurrentView,
        students,
        classes,
        merchandiseItems,
        userProfile,
    } = useAppStore();

    const addStudent = async (student: Omit<Student, 'id'>) => {
        await addStudentToDb({
            ...student,
            enrollmentDate: student.enrollmentDate || new Date().toISOString().split('T')[0],
            monthlyFee: student.monthlyFee ?? 19,
            paymentMethod: student.paymentMethod || 'Efectivo',
            enrolledClassIds: student.enrolledClassIds || [],
        });
        queryClient.invalidateQueries({ queryKey: ['students'] });
    };

    const updateStudent = async (updatedStudent: Student) => {
        await updateStudentInDb(updatedStudent);
        queryClient.invalidateQueries({ queryKey: ['students'] });
    };

    const deleteStudent = async (studentId: string) => {
        await deleteStudentFromDb(studentId);
        queryClient.invalidateQueries({ queryKey: ['students'] });
    };

    const addInstructor = async (instructor: Omit<Instructor, 'id'>) => {
        await addInstructorToDb({
            ...instructor,
            active: instructor.active !== undefined ? instructor.active : true,
            hireDate: instructor.hireDate || new Date().toISOString().split('T')[0],
        });
        queryClient.invalidateQueries({ queryKey: ['instructors'] });
    };

    const updateInstructor = async (updatedInstructor: Instructor) => {
        await updateInstructorInDb(updatedInstructor);
        queryClient.invalidateQueries({ queryKey: ['instructors'] });
    };

    const deleteInstructor = async (instructorId: string) => {
        const isAssigned = classes.some(c => c.instructorId === instructorId);
        if (isAssigned) {
            alert('Este profesor está asignado a clases. Por favor, reasigna esas clases antes de eliminarlo.');
            return;
        }
        await deleteInstructorFromDb(instructorId);
        queryClient.invalidateQueries({ queryKey: ['instructors'] });
    };

    const addClass = async (danceClass: Omit<DanceClass, 'id'>) => {
        await addClassToDb(danceClass);
        queryClient.invalidateQueries({ queryKey: ['classes'] });
    };

    const updateClass = async (updatedClass: DanceClass) => {
        await updateClassInDb(updatedClass);
        queryClient.invalidateQueries({ queryKey: ['classes'] });
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
        queryClient.invalidateQueries({ queryKey: ['classes'] });
        queryClient.invalidateQueries({ queryKey: ['students'] });
    };

    const addPayment = async (payment: Omit<Payment, 'id'>) => {
        await addPaymentToDb(payment);
        queryClient.invalidateQueries({ queryKey: ['payments'] });

        // Log activity for SuperAdmin notification if Admin made the action
        if (userProfile && userProfile.role === 'Admin') {
            const student = students.find(s => s.id === payment.studentId);
            await logActivity({
                type: 'payment',
                actorEmail: userProfile.email,
                actorName: userProfile.name,
                description: `Cobro registrado: ${payment.amount}€ de ${student?.name || 'Alumno'} (${payment.concept})`,
                targetRole: 'SuperAdmin'
            });
        }
    };

    const updatePayment = async (payment: Payment) => {
        await updatePaymentInDb(payment);
        queryClient.invalidateQueries({ queryKey: ['payments'] });
    };

    const deletePayment = async (paymentId: string) => {
        await deletePaymentFromDb(paymentId);
        queryClient.invalidateQueries({ queryKey: ['payments'] });
    };

    const addCost = async (cost: Omit<Cost, 'id'>) => {
        await addCostToDb(cost);
        queryClient.invalidateQueries({ queryKey: ['costs'] });

        // Log activity for SuperAdmin notification if Admin made the action
        if (userProfile && userProfile.role === 'Admin') {
            await logActivity({
                type: 'cost',
                actorEmail: userProfile.email,
                actorName: userProfile.name,
                description: `Gasto registrado: ${cost.amount}€ - ${cost.concept} (${cost.category})`,
                targetRole: 'SuperAdmin'
            });
        }
    };

    const updateCost = async (updatedCost: Cost) => {
        await updateCostInDb(updatedCost);
        queryClient.invalidateQueries({ queryKey: ['costs'] });
    };

    const deleteCost = async (costId: string) => {
        await deleteCostFromDb(costId);
        queryClient.invalidateQueries({ queryKey: ['costs'] });
    };

    const addNuptialDance = async (dance: Omit<NuptialDance, 'id'>) => {
        await addNuptialDanceToDb(dance);
        queryClient.invalidateQueries({ queryKey: ['nuptialDances'] });
    };

    const updateNuptialDance = async (updatedDance: NuptialDance) => {
        await updateNuptialDanceInDb(updatedDance);
        queryClient.invalidateQueries({ queryKey: ['nuptialDances'] });
    };

    const deleteNuptialDance = async (danceId: string) => {
        await deleteNuptialDanceFromDb(danceId);
        queryClient.invalidateQueries({ queryKey: ['nuptialDances'] });
    };

    const addEvent = async (event: Omit<DanceEvent, 'id'>) => {
        const studentIds = event.participants.map(p => p.studentId);
        await addEventToDb({ ...event, studentIds });
        queryClient.invalidateQueries({ queryKey: ['events'] });
    };

    const updateEvent = async (event: DanceEvent) => {
        const studentIds = event.participants.map(p => p.studentId);
        await updateEventInDb({ ...event, studentIds });
        queryClient.invalidateQueries({ queryKey: ['events'] });
    };

    const deleteEvent = async (eventId: string) => {
        await deleteEventFromDb(eventId);
        queryClient.invalidateQueries({ queryKey: ['events'] });
    };

    const addMerchandiseItem = async (item: Omit<MerchandiseItem, 'id'>) => {
        await addMerchandiseItemToDb(item);
        queryClient.invalidateQueries({ queryKey: ['merchandiseItems'] });
    };

    const updateMerchandiseItem = async (item: MerchandiseItem) => {
        await updateMerchandiseItemInDb(item);
        queryClient.invalidateQueries({ queryKey: ['merchandiseItems'] });
    };

    const deleteMerchandiseItem = async (itemId: string) => {
        await deleteMerchandiseItemFromDb(itemId);
        queryClient.invalidateQueries({ queryKey: ['merchandiseItems'] });
    };

    const addMerchandiseSale = async (sale: Omit<MerchandiseSale, 'id'>) => {
        try {
            await executeMerchandiseSale(sale);
            queryClient.invalidateQueries({ queryKey: ['merchandiseItems'] });
            queryClient.invalidateQueries({ queryKey: ['merchandiseSales'] });
        } catch (error: any) {
            alert(error.message || 'Error al procesar la venta');
        }
    };

    const deleteMerchandiseSale = async (sale: MerchandiseSale) => {
        try {
            await cancelMerchandiseSale(sale);
            queryClient.invalidateQueries({ queryKey: ['merchandiseItems'] });
            queryClient.invalidateQueries({ queryKey: ['merchandiseSales'] });
        } catch (error: any) {
            alert(error.message || 'Error al cancelar la venta');
        }
    };

    const saveAttendance = async (record: Omit<AttendanceRecord, 'id'> | AttendanceRecord) => {
        if ('id' in record) {
            await updateAttendanceInDb(record);
        } else {
            await addAttendanceToDb(record);
        }
        queryClient.invalidateQueries({ queryKey: ['attendance'] });

        // Update progress for all students involved (present or previously present)
        try {
            const affectedStudentIds = record.presentStudentIds;

            if (affectedStudentIds.length > 0) {
                const progressPromises = affectedStudentIds.map(async (studentId) => {
                    // We don't need a query here if updateProgressAfterAttendance does it, 
                    // but let's assume we want to force refresh student data too
                    queryClient.invalidateQueries({ queryKey: ['progress', studentId] });
                });

                await Promise.all(progressPromises);
            }

        } catch (error) {
            console.error('[useAppActions] Error updating progress invalidation:', error);
        }

        // Log activity for SuperAdmin notification if Admin made the action
        if (userProfile && userProfile.role === 'Admin') {
            const classObj = classes.find(c => c.id === record.classId);
            await logActivity({
                type: 'attendance',
                actorEmail: userProfile.email,
                actorName: userProfile.name,
                description: `Asistencia registrada: ${classObj?.name || 'Clase'} el ${new Date(record.date).toLocaleDateString('es-ES')} (${record.presentStudentIds.length} presentes)`,
                targetRole: 'SuperAdmin'
            });
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
