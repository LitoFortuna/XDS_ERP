
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../../services/domain/eventService';
import { DanceEvent } from '../../../types';

// Mutations live in useAppActions.ts (addEvent/updateEvent/deleteEvent), which already
// invalidates the 'events' query key below on success.
const EMPTY_EVENTS: DanceEvent[] = [];

export const useEvents = () => {
    const { data: events = EMPTY_EVENTS, isLoading, error } = useQuery({
        queryKey: ['events'],
        queryFn: fetchEvents,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    return { events, isLoading, error };
};
