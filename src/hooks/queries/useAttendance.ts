
import { useQuery } from '@tanstack/react-query';
import { fetchAttendance } from '../../services/domain/attendanceService';
import { AttendanceRecord } from '../../../types';

// Mutations live in useAppActions.ts (saveAttendance), which already invalidates the
// 'attendance' query key below on success.
const EMPTY_ATTENDANCE: AttendanceRecord[] = [];

// `enabled` lets callers defer this fetch until it's actually needed (attendance is one of the
// largest, fastest-growing collections, and it's only ever shown in the Attendance view) instead
// of pulling it on every ERP load regardless of which screen the admin opens.
export const useAttendance = (enabled: boolean = true) => {
    const { data: attendanceRecords = EMPTY_ATTENDANCE, isLoading, error } = useQuery({
        queryKey: ['attendance'],
        queryFn: fetchAttendance,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        enabled,
    });

    return { attendanceRecords, isLoading, error };
};
