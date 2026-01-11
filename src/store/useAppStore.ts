
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { 
  Student, Instructor, DanceClass, Payment, Cost, 
  NuptialDance, DanceEvent, MerchandiseItem, MerchandiseSale, 
  AttendanceRecord, View 
} from '../types';
import { User } from 'firebase/auth';

interface AppState {
  // Auth
  user: User | null;
  authLoading: boolean;
  
  // Navigation & UI
  currentView: View;
  isSidebarOpen: boolean;
  dataLoading: boolean;
  
  // Birthdays
  isBirthdayModalOpen: boolean;
  birthdaysToday: Student[];
  hasCheckedBirthdays: boolean;
  
  // Data
  students: Student[];
  instructors: Instructor[];
  classes: DanceClass[];
  payments: Payment[];
  costs: Cost[];
  nuptialDances: NuptialDance[];
  events: DanceEvent[];
  merchandiseItems: MerchandiseItem[];
  merchandiseSales: MerchandiseSale[];
  attendanceRecords: AttendanceRecord[];
}

interface AppActions {
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setCurrentView: (view: View) => void;
  setSidebarOpen: (open: boolean) => void;
  setDataLoading: (loading: boolean) => void;
  setBirthdayModalOpen: (open: boolean) => void;
  setBirthdaysToday: (students: Student[]) => void;
  setHasCheckedBirthdays: (checked: boolean) => void;
  
  // State Setters (for Firebase subscriptions)
  setStudents: (students: Student[]) => void;
  setInstructors: (instructors: Instructor[]) => void;
  setClasses: (classes: DanceClass[]) => void;
  setPayments: (payments: Payment[]) => void;
  setCosts: (costs: Cost[]) => void;
  setNuptialDances: (dances: NuptialDance[]) => void;
  setEvents: (events: DanceEvent[]) => void;
  setMerchandiseItems: (items: MerchandiseItem[]) => void;
  setMerchandiseSales: (sales: MerchandiseSale[]) => void;
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  immer((set) => ({
    // Initial State
    user: null,
    authLoading: true,
    currentView: View.DASHBOARD,
    isSidebarOpen: false,
    dataLoading: true,
    isBirthdayModalOpen: false,
    birthdaysToday: [],
    hasCheckedBirthdays: false,
    students: [],
    instructors: [],
    classes: [],
    payments: [],
    costs: [],
    nuptialDances: [],
    events: [],
    merchandiseItems: [],
    merchandiseSales: [],
    attendanceRecords: [],

    // Actions
    setUser: (user) => set((state) => { state.user = user; }),
    setAuthLoading: (loading) => set((state) => { state.authLoading = loading; }),
    setCurrentView: (view) => set((state) => { state.currentView = view; }),
    setSidebarOpen: (open) => set((state) => { state.isSidebarOpen = open; }),
    setDataLoading: (loading) => set((state) => { state.dataLoading = loading; }),
    setBirthdayModalOpen: (open) => set((state) => { state.isBirthdayModalOpen = open; }),
    setBirthdaysToday: (students) => set((state) => { state.birthdaysToday = students; }),
    setHasCheckedBirthdays: (checked) => set((state) => { state.hasCheckedBirthdays = checked; }),
    
    setStudents: (students) => set((state) => { state.students = students; }),
    setInstructors: (instructors) => set((state) => { state.instructors = instructors; }),
    setClasses: (classes) => set((state) => { state.classes = classes; }),
    setPayments: (payments) => set((state) => { state.payments = payments; }),
    setCosts: (costs) => set((state) => { state.costs = costs; }),
    setNuptialDances: (dances) => set((state) => { state.nuptialDances = dances; }),
    setEvents: (events) => set((state) => { state.events = events; }),
    setMerchandiseItems: (items) => set((state) => { state.merchandiseItems = items; }),
    setMerchandiseSales: (sales) => set((state) => { state.merchandiseSales = sales; }),
    setAttendanceRecords: (records) => set((state) => { state.attendanceRecords = records; }),
  }))
);
