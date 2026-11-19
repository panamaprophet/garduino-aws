import { toCursor } from '@/shared/cursor';
import { defineHandler, getPathParameter, respond } from '@/shared/http';
import { parse } from '@/shared/validation';
import { toEventResponse } from '../../entity/event.model';
import { listEventsPage } from '../../entity/event.api';
import { listEventsSchema } from './list-events.schema';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const query = event.queryStringParameters ?? {};

    const params = parse(listEventsSchema, query, 'Invalid query parameters');
    const { items, lastKey } = await listEventsPage(controllerId, params);

    const events = items.map(toEventResponse);
    const nextCursor = lastKey ? toCursor({ ...params, lastKey }) : null;
    const meta = {
        pagination: { nextCursor, limit: params.limit },
        query: { from: new Date(params.from).toISOString(), to: new Date(params.to).toISOString() },
    };

    return respond(events, { meta });
});
