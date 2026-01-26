
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClasses, addClass, updateClass, deleteClass } from '../../services/domain/classService';
import { DanceClass } from '../../../types';

export const useClasses = () => {
    const queryClient = useQueryClient();

    const { data: classes = [], isLoading, error } = useQuery({
        queryKey: ['classes'],
        queryFn: fetchClasses,
        staleTime: 1000 * 60 * 15, // 15 minutes cache
    });

    const addMutation = useMutation({
        mutationFn: addClass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateClass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteClass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
        },
    });

    return {
        classes,
        isLoading,
        error,
        addClass: addMutation.mutateAsync,
        updateClass: updateMutation.mutateAsync,
        deleteClass: deleteMutation.mutateAsync,
    };
};
