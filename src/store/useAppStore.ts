
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Student, Instructor, DanceClass, Payment, Cost, PaymentMethod, View, MerchandiseItem, AttendanceRecord, MerchandiseSale, DanceEvent, NuptialDance, UserRole, UserProfile, ActivityLog } from '../../types';
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
  events: DanceEvent[];
  nuptialDances: NuptialDance[];
  merchandiseItems: MerchandiseItem[];
  merchandiseSales: MerchandiseSale[];
  attendanceRecords: AttendanceRecord[];

  // User Profile & Role
  userProfile: UserProfile | null;
  activityLogs: ActivityLog[];
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
  setEvents: (events: DanceEvent[]) => void;
  setNuptialDances: (dances: NuptialDance[]) => void;
  setMerchandiseItems: (items: MerchandiseItem[]) => void;
  setMerchandiseSales: (sales: MerchandiseSale[]) => void;
  setAttendanceRecords: (records: AttendanceRecord[]) => void;

  // User Profile & Activity
  setUserProfile: (profile: UserProfile | null) => void;
  setActivityLogs: (logs: ActivityLog[]) => void;
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
    events: [],
    nuptialDances: [],
    merchandiseItems: [],
    merchandiseSales: [],
    attendanceRecords: [],
    userProfile: null,
    activityLogs: [],

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
    setEvents: (events) => set((state) => { state.events = events; }),
    setNuptialDances: (nuptialDances) => set((state) => { state.nuptialDances = nuptialDances; }),
    setMerchandiseItems: (items) => set((state) => { state.merchandiseItems = items; }),
    setMerchandiseSales: (sales) => set((state) => { state.merchandiseSales = sales; }),
    setAttendanceRecords: (records) => set((state) => { state.attendanceRecords = records; }),
    setUserProfile: (profile) => set((state) => { state.userProfile = profile; }),
    setActivityLogs: (logs) => set((state) => { state.activityLogs = logs; }),
  }))
);
