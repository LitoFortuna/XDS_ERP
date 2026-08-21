
import { useQuery } from '@tanstack/react-query';
import { fetchMerchandiseItems, fetchMerchandiseSales } from '../../services/domain/merchandiseService';
import { MerchandiseItem, MerchandiseSale } from '../../../types';

// Mutations live in useAppActions.ts (addMerchandiseItem/updateMerchandiseItem/
// deleteMerchandiseItem/addMerchandiseSale/deleteMerchandiseSale), which already invalidates
// the 'merchandiseItems'/'merchandiseSales' query keys below on success.
const EMPTY_ITEMS: MerchandiseItem[] = [];
const EMPTY_SALES: MerchandiseSale[] = [];

export const useMerchandiseItems = () => {
    const { data: merchandiseItems = EMPTY_ITEMS, isLoading, error } = useQuery({
        queryKey: ['merchandiseItems'],
        queryFn: fetchMerchandiseItems,
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });

    return { merchandiseItems, isLoading, error };
};

export const useMerchandiseSales = () => {
    const { data: merchandiseSales = EMPTY_SALES, isLoading, error } = useQuery({
        queryKey: ['merchandiseSales'],
        queryFn: fetchMerchandiseSales,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    return { merchandiseSales, isLoading, error };
};
