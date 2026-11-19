import { defineHandler, getPathParameter } from '@/shared/http';
import { parse } from '@/shared/validation';
import { toEventResponse } from '../../entity/event.model';
import { listEvents } from '../../entity/event.api';
import { listEventsSchema } from './list-events.schema';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const query = event.queryStringParameters ?? {};

    const range = parse(listEventsSchema, query, 'Invalid query parameters');
    const events = await listEvents(controllerId, range);

    return events.map(toEventResponse);
});
