
import { useQuery } from '@tanstack/react-query';
import { fetchMerchandiseItems, fetchMerchandiseSales } from '../../services/domain/merchandiseService';
import { MerchandiseItem, MerchandiseSale } from '../../../types';

// Mutations live in useAppActions.ts (addMerchandiseItem/updateMerchandiseItem/
// deleteMerchandiseItem/addMerchandiseSale/deleteMerchandiseSale), which already invalidates
// the 'merchandiseItems'/'merchandiseSales' query keys below on success.
const EMPTY_ITEMS: MerchandiseItem[] = [];
const EMPTY_SALES: MerchandiseSale[] = [];

// `enabled` lets callers defer this fetch until a view that actually needs merchandise data has
// been opened, instead of pulling it on every ERP load regardless of which screen is active.
export const useMerchandiseItems = (enabled: boolean = true) => {
    const { data: merchandiseItems = EMPTY_ITEMS, isLoading, error } = useQuery({
        queryKey: ['merchandiseItems'],
        queryFn: fetchMerchandiseItems,
        staleTime: 1000 * 60 * 10, // 10 minutes cache
        enabled,
    });

    return { merchandiseItems, isLoading, error };
};

export const useMerchandiseSales = (enabled: boolean = true) => {
    const { data: merchandiseSales = EMPTY_SALES, isLoading, error } = useQuery({
        queryKey: ['merchandiseSales'],
        queryFn: fetchMerchandiseSales,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        enabled,
    });

    return { merchandiseSales, isLoading, error };
};
