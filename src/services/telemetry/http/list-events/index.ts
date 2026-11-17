import { defineHandler, getPathParameter } from '@/lib/http';
import { parse } from '@/lib/validation';
import { toEventResponse } from '../../domain/event';
import { listEvents } from '../../store/events';
import { eventsQuerySchema } from './events-query.schema';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const range = parse(eventsQuerySchema, event.queryStringParameters ?? {}, 'Invalid query parameters');

    const events = await listEvents(controllerId, range);

    return events.map(toEventResponse);
});
