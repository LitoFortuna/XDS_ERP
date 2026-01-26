
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPayments, addPayment, updatePayment, deletePayment } from '../../services/domain/financeService';
import { Payment } from '../../../types';

export const usePayments = () => {
    const queryClient = useQueryClient();

    const { data: payments = [], isLoading, error } = useQuery({
        queryKey: ['payments'],
        queryFn: fetchPayments,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const addMutation = useMutation({
        mutationFn: addPayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: updatePayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deletePayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
        },
    });

    return {
        payments,
        isLoading,
        error,
        addPayment: addMutation.mutateAsync,
        updatePayment: updateMutation.mutateAsync,
        deletePayment: deleteMutation.mutateAsync,
    };
};
