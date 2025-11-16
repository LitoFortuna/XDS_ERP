export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Domiciliación' | 'Bizum';
export type CostPaymentMethod = 'Efectivo' | 'Transferencia' | 'Domiciliación' | 'Tarjeta';


export interface Student {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  enrolledClassIds: string[];
  monthlyFee: number;
  paymentMethod: PaymentMethod;
  iban?: string;
  active: boolean;
  notes?: string;
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
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
export type ClassCategory = 'Fitness' | 'Baile Moderno' | 'Competición' | 'Especializada';

export interface DanceClass {
  id: string;
  name: string;
  instructorId: string;
  category: ClassCategory;
  days: DayOfWeek[];
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  capacity: number;
  baseRate: number;
}


export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  concept: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export type CostCategory = 'Profesores' | 'Alquiler' | 'Suministros' | 'Licencias' | 'Marketing' | 'Mantenimiento' | 'Otros';

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
}


export enum View {
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  CLASSES = 'CLASSES',
  INSTRUCTORS = 'INSTRUCTORS',
  BILLING = 'BILLING',
  INTERACTIVE_SCHEDULE = 'INTERACTIVE_SCHEDULE',
  NUPTIAL_DANCES = 'NUPTIAL_DANCES',
  DATA_MANAGEMENT = 'DATA_MANAGEMENT',
}