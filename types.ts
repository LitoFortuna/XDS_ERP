
export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Domiciliación' | 'Bizum';
export type CostPaymentMethod = 'Efectivo' | 'Transferencia' | 'Domiciliación' | 'Tarjeta';


export interface Student {
  id: string;
  name: string;
  enrollmentDate: string; // YYYY-MM-DD
  deactivationDate?: string; // YYYY-MM-DD (Fecha de baja)
  birthDate?: string; // Made optional
  phone?: string;     // Made optional
  email?: string;     // Made optional
  enrolledClassIds: string[];
  classGroups?: { [classId: string]: string }; // classId -> id del grupo de esa clase (solo clases con grupos)
  monthlyFee: number;
  paymentMethod: PaymentMethod;
  active: boolean;
  notes?: string;
  feeExceptions?: { [key: string]: number }; // Key: "YYYY-M", Value: specific amount for that month
  // Cuota de mantenimiento de agosto, si este alumno tiene una negociada (algunos alumnos pagan
  // menos en agosto). Se aplica automáticamente cada agosto sin tener que crear un feeException
  // manual cada año; un feeException específico para ese "YYYY-7" concreto sigue teniendo prioridad
  // si alguna vez hace falta una excepción puntual distinta de la cuota de agosto habitual.
  augustMaintenanceFee?: number;
  deletedAt?: string; // ISO timestamp. Presente = en la Papelera, no se borra de verdad hasta pasar 30 días.
}

// dni/iban live in students/{id}/private/sensitive, NOT on the main Student doc, which is
// publicly readable (needed by the unauthenticated Student Portal). Firestore rules restrict
// reads of this subdocument to admins or the student's own authenticated session.
export interface StudentPrivateData {
  dni?: string;
  iban?: string;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  phone: string;
  ratePerClass: number;
  active: boolean;
  hireDate: string; // YYYY-MM-DD
  notes?: string;
  deletedAt?: string;
  hasAccess?: boolean; // Tiene cuenta de acceso al ERP (rol profesor); la gestiona manageInstructorAccount
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
export type ClassCategory = 'Fitness' | 'Baile Moderno' | 'Competición' | 'Especializada';

// Grupo dentro de una clase con sus propios profesores (p. ej. "Parejas" con Pablo y "Solista" con
// Vic y Diana en Competición MiniSolista/MiniParejas). Cada alumna se asigna a un grupo con
// Student.classGroups; cada profesor solo ve y pasa lista de su grupo.
export interface ClassGroup {
  id: string;
  name: string;
  instructorIds: string[];
}

export interface DanceClass {
  id: string;
  name: string;
  instructorId: string; // Profesor principal (el primero del primer grupo si la clase tiene grupos)
  instructorIds?: string[]; // TODOS los profesores de la clase (principal + los de cada grupo); permite consultarlos por array-contains
  groups?: ClassGroup[]; // Vacío o ausente = clase sin grupos, todas las alumnas con el profesor principal
  category: ClassCategory;
  days: DayOfWeek[];
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  capacity: number;
  baseRate: number;
  instructorName?: string; // Populated at runtime for display
  deletedAt?: string;
}


export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  concept: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  deletedAt?: string;
}

export type CostCategory = 'Profesores' | 'Alquiler' | 'Suministros' | 'Licencias' | 'Impuestos' | 'Marketing' | 'Mantenimiento' | 'Otros';

export interface Cost {
  id: string;
  paymentDate: string; // YYYY-MM-DD
  category: CostCategory;
  beneficiary: string;
  concept: string;
  amount: number; // Stored as a positive number
  paymentMethod: CostPaymentMethod;
  isRecurring: boolean;
  notes?: string;
  relatedInstructorId?: string; // Optional link to an instructor for better analytics
  deletedAt?: string;
}

export interface Rehearsal {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: 'Pendiente' | 'Completado' | 'Cancelado';
}

export interface NuptialDance {
  id: string;
  coupleName: string;
  phone: string;
  email: string;
  weddingDate: string; // YYYY-MM-DD
  song: string;
  instructorId: string;
  rehearsals: Rehearsal[];
  package: string;
  totalHours: number;
  totalCost: number;
  paidAmount: number;
  notes?: string;
  deletedAt?: string;
}

export type EventType = 'Competición' | 'Exhibición' | 'Taller' | 'Otro';

export interface EventParticipant {
  studentId: string;
  ticketCount: number;
}

export interface DanceEvent {
  id: string;
  name: string;
  type: EventType;
  studentIds: string[];
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  price: number;
  participants: EventParticipant[];
  notes?: string;
  imageUrl?: string; // Nuevo campo para el cartel del evento
  capacity?: number; // Aforo máximo, opcional -- sin definir, la autoinscripción del Portal no limita plazas
  deletedAt?: string;
}

export interface MerchandiseItem {
  id: string;
  name: string;
  category: string;
  size?: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  imageUrl?: string;
  notes?: string;
}

export interface MerchandiseSale {
  id: string;
  itemId: string;
  itemName: string; // Denormalized for easier display
  studentId?: string; // Optional
  quantity: number;
  totalAmount: number;
  saleDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
}

// Aviso de una alumna de que no podrá asistir a una sesión concreta de una clase (Portal de
// Alumno). Es solo informativo para el profesor/admin -- no modifica la asistencia real, que
// sigue marcándose aparte en AttendanceRecord cuando toca la clase.
export interface ClassAbsence {
  id: string;
  studentId: string;
  studentName: string; // Denormalizado para mostrarlo sin tener que cruzar con students
  classId: string;
  className: string; // Denormalizado igual que studentName
  date: string; // YYYY-MM-DD, fecha concreta de la sesión que se avisa
  createdAt: string; // ISO timestamp
}

export type PlannerTaskPriority = 'low' | 'medium' | 'high';
export type PlannerTaskCategory = 'Administrativo' | 'Clases' | 'Eventos' | 'Marketing' | 'Otro';

// Tarea pendiente o recordatorio de planificación del propio equipo (apartado Calendario). Sin
// `dueDate` es una tarea "sin fecha" -- pendiente pero todavía sin planificar en el calendario.
export interface PlannerTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM, opcional
  priority: PlannerTaskPriority;
  category: PlannerTaskCategory;
  completed: boolean;
  completedAt?: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  presentStudentIds: string[]; // List of students present
  notes?: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  CLASSES = 'CLASSES',
  INSTRUCTORS = 'INSTRUCTORS',
  BILLING = 'BILLING',
  QUARTERLY_INVOICING = 'QUARTERLY_INVOICING',
  MERCHANDISING = 'MERCHANDISING',
  INTERACTIVE_SCHEDULE = 'INTERACTIVE_SCHEDULE',
  NUPTIAL_DANCES = 'NUPTIAL_DANCES',
  DATA_MANAGEMENT = 'DATA_MANAGEMENT',
  ATTENDANCE = 'ATTENDANCE',
  EVENTS = 'EVENTS',
  CHANGE_REQUESTS = 'CHANGE_REQUESTS',
  PLANNER = 'PLANNER',
  TRASH = 'TRASH',
}

export type UserRole = 'SuperAdmin' | 'Admin' | 'Editor' | 'Instructor' | 'Student';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name?: string;
  instructorId?: string; // Solo rol Instructor: ficha de profesor a la que está vinculada la cuenta
  pushSubscription?: string; // JSON stringified PushSubscription for cross-device push
}

export interface ActivityLog {
  id?: string;
  type: 'attendance' | 'payment' | 'cost';
  actorEmail: string;
  actorName?: string;
  description: string;
  timestamp: string;
  read: boolean;
  targetRole: UserRole; // Who should receive this notification
}

export type ChangeRequestStatus = 'Pendiente' | 'Aprobada' | 'Rechazada';

export interface ChangeRequest {
  id: string;
  studentId: string;
  studentName: string; // Denormalized for easier display
  requestDate: string; // ISO timestamp
  status: ChangeRequestStatus;
  currentData: {
    name?: string;
    phone?: string;
    birthDate?: string;
    email?: string;
    dni?: string;
  };
  requestedData: {
    name?: string;
    phone?: string;
    birthDate?: string;
    email?: string;
    dni?: string;
  };
  reviewedBy?: string; // Email of admin who reviewed
  reviewDate?: string; // ISO timestamp
  reviewNotes?: string; // Optional notes from admin
}

// ============================================
// Gamification & Progress System
// ============================================

export type BadgeCategory = 'attendance' | 'events' | 'community' | 'milestone';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  category: BadgeCategory;
  criteria: {
    type: 'total_classes' | 'streak_days' | 'attendance_percent' | 'events' | 'first_class'
      | 'distinct_instructors' | 'weekly_minutes' | 'competition' | 'merch'; // ver services/badgeRules.ts
    value: number;
  };
}

export interface StudentAchievement {
  badgeId: string;
  unlockedDate: string; // ISO timestamp
}

export interface MonthlyStats {
  attended: number;
  total: number;
  percentage: number;
}

export interface StudentProgress {
  studentId: string;
  points: number;
  level: number;
  currentStreak: number;
  recordStreak: number;
  lastAttendanceDate: string | null;
  totalClasses: number;
  totalHours: number;
  totalEvents: number;
  monthlyStats: {
    [month: string]: MonthlyStats; // "2024-06"
  };
  achievements: StudentAchievement[];
}
