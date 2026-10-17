import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

// Datos que devuelve la Cloud Function teacherOverview: SOLO las clases del profesor y sus alumnas
// (sin teléfono, cuotas ni notas). Ver functions/src/teacherData.ts.

export interface TeacherClass {
    id: string;
    name: string;
    category: string;
    days: string[];
    startTime: string;
    endTime: string;
    capacity: number;
}

export interface TeacherStudent {
    id: string;
    name: string;
    birthDate?: string;
    enrollmentDate?: string;
    active: boolean;
    enrolledClassIds: string[];
}

export interface TeacherAttendanceRecord {
    id: string;
    classId: string;
    date: string; // YYYY-MM-DD
    presentStudentIds: string[];
    notes?: string;
}

export interface TeacherAbsence {
    id: string;
    classId: string;
    studentId: string;
    studentName: string;
    date: string;
}

export interface TeacherEvent {
    id: string;
    name: string;
    type: string;
    date: string; // YYYY-MM-DD
    time: string;
    location: string;
    capacity?: number;
    enrolledCount: number; // inscritas en total
    myStudents: string[]; // nombres de sus alumnas apuntadas
}

export interface TeacherOverview {
    today: string; // YYYY-MM-DD en hora de Madrid
    instructor: { id: string; name: string };
    classes: TeacherClass[];
    students: TeacherStudent[];
    attendance: TeacherAttendanceRecord[];
    absences: TeacherAbsence[];
    events: TeacherEvent[]; // próximos, de más cercano a más lejano
}

export const fetchTeacherOverview = async (): Promise<TeacherOverview> => {
    const callable = httpsCallable<void, TeacherOverview>(functions, 'teacherOverview');
    return (await callable()).data;
};

export const saveTeacherAttendance = async (input: {
    classId: string;
    date: string;
    presentStudentIds: string[];
    notes: string;
}): Promise<{ id: string }> => {
    const callable = httpsCallable<typeof input, { id: string }>(functions, 'teacherSaveAttendance');
    return (await callable(input)).data;
};

export interface InstructorAccountResult {
    email?: string;
    password?: string;
    emailSent?: boolean; // solo en create: si se pudo enviar el email de bienvenida
    ok?: boolean;
}

// Solo administradores (lo valida el servidor). create/reset devuelven una contraseña temporal UNA vez.
export const manageInstructorAccount = async (
    action: 'create' | 'reset' | 'revoke',
    instructorId: string
): Promise<InstructorAccountResult> => {
    const callable = httpsCallable<{ action: string; instructorId: string }, InstructorAccountResult>(functions, 'manageInstructorAccount');
    return (await callable({ action, instructorId })).data;
};
