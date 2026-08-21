
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStudents, addStudent, updateStudent, deleteStudent } from '../../services/domain/studentService';
import { Student } from '../../../types';

// Stable reference: `data: x = []` in the destructuring below would create a brand new array on
// every render while data is undefined, which changes identity every time and — combined with
// App.tsx syncing straight into Zustand on every reference change — caused an infinite
// render loop (React error #185) while students were still loading.
const EMPTY_STUDENTS: Student[] = [];

export const useStudents = () => {
    const queryClient = useQueryClient();

    const { data: students = EMPTY_STUDENTS, isLoading, error } = useQuery({
        queryKey: ['students'],
        queryFn: fetchStudents,
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });

    const addMutation = useMutation({
        mutationFn: addStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });

    return {
        students,
        isLoading,
        error,
        addStudent: addMutation.mutateAsync,
        updateStudent: updateMutation.mutateAsync,
        deleteStudent: deleteMutation.mutateAsync,
        isAdding: addMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};
