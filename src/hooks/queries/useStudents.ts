
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStudents, addStudent, updateStudent, deleteStudent } from '../../services/domain/studentService';
import { Student } from '../../../types';

export const useStudents = () => {
    const queryClient = useQueryClient();

    const { data: students = [], isLoading, error } = useQuery({
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
