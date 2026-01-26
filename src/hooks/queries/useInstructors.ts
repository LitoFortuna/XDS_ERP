
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInstructors, addInstructor, updateInstructor, deleteInstructor } from '../../services/domain/instructorService';
import { Instructor } from '../../../types';

export const useInstructors = () => {
    const queryClient = useQueryClient();

    const { data: instructors = [], isLoading, error } = useQuery({
        queryKey: ['instructors'],
        queryFn: fetchInstructors,
        staleTime: 1000 * 60 * 30, // 30 minutes cache (teachers change rarely)
    });

    const addMutation = useMutation({
        mutationFn: addInstructor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateInstructor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteInstructor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
        },
    });

    return {
        instructors,
        isLoading,
        error,
        addInstructor: addMutation.mutateAsync,
        updateInstructor: updateMutation.mutateAsync,
        deleteInstructor: deleteMutation.mutateAsync,
    };
};
