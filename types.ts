
export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Domiciliación' | 'Bizum';
export type CostPaymentMethod = 'Efectivo' | 'Transferencia' | 'Domiciliación' | 'Tarjeta';


export interface Student {
  id: string;
  name: string;
  enrollmentDate: string; // YYYY-MM-DD
  deactivationDate?: string; // YYYY-MM-DD (Fecha de baja)
  birthDate: string;
  phone: string;
  email: string;
  enrolledClassIds: string[];
  monthlyFee: number;
  paymentMethod: PaymentMethod;
  iban?: string;
  active: boolean;
  notes?: string;
  feeExceptions?: { [key: string]: number }; // Key: "YYYY-M", Value: specific amount for that month
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
  relatedInstructorId?: string; // Optional link to an instructor for better analytics
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
}