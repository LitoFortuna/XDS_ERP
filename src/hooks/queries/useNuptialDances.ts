
import { useQuery } from '@tanstack/react-query';
import { fetchNuptialDances } from '../../services/domain/nuptialService';
import { NuptialDance } from '../../../types';

// Mutations live in useAppActions.ts (addNuptialDance/updateNuptialDance/deleteNuptialDance),
// which already invalidates the 'nuptialDances' query key below on success.
const EMPTY_NUPTIAL_DANCES: NuptialDance[] = [];

export const useNuptialDances = () => {
    const { data: nuptialDances = EMPTY_NUPTIAL_DANCES, isLoading, error } = useQuery({
        queryKey: ['nuptialDances'],
        queryFn: fetchNuptialDances,
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });

    return { nuptialDances, isLoading, error };
};
