
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCosts, addCost, updateCost, deleteCost } from '../../services/domain/financeService';
import { Cost } from '../../../types';

export const useCosts = () => {
    const queryClient = useQueryClient();

    const { data: costs = [], isLoading, error } = useQuery({
        queryKey: ['costs'],
        queryFn: fetchCosts,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const addMutation = useMutation({
        mutationFn: addCost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['costs'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateCost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['costs'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['costs'] });
        },
    });

    return {
        costs,
        isLoading,
        error,
        addCost: addMutation.mutateAsync,
        updateCost: updateMutation.mutateAsync,
        deleteCost: deleteMutation.mutateAsync,
    };
};
