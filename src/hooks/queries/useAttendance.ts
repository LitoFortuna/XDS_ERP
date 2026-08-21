
import { useQuery } from '@tanstack/react-query';
import { fetchAttendance } from '../../services/domain/attendanceService';
import { AttendanceRecord } from '../../../types';

// Mutations live in useAppActions.ts (saveAttendance), which already invalidates the
// 'attendance' query key below on success.
const EMPTY_ATTENDANCE: AttendanceRecord[] = [];

export const useAttendance = () => {
    const { data: attendanceRecords = EMPTY_ATTENDANCE, isLoading, error } = useQuery({
        queryKey: ['attendance'],
        queryFn: fetchAttendance,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    return { attendanceRecords, isLoading, error };
};
