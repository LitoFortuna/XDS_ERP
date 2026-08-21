
import { DanceEvent } from '../../types';

export const getEventTicketCount = (event: DanceEvent): number => {
    return event.participants?.reduce((sum, p) => sum + (p.ticketCount || 0), 0) || 0;
};

export const getEventRevenue = (event: DanceEvent): number => {
    return getEventTicketCount(event) * event.price;
};
