import { controllerParams, defineHandler, toCursor } from '@/shared/http';
import { toEventResponse } from '../../entity/event.model';
import { listEventsPage } from '../../entity/event.api';
import { listEventsSchema } from './list-events.schema';

export const handler = defineHandler({ params: controllerParams, query: listEventsSchema }, async ({ params: { controllerId }, query }) => {
    const { items, lastKey } = await listEventsPage(controllerId, query);

    const data = items.map(toEventResponse);
    const nextCursor = lastKey ? toCursor({ ...query, lastKey }) : null;
    const meta = {
        pagination: { nextCursor, limit: query.limit },
        query: { from: new Date(query.from).toISOString(), to: new Date(query.to).toISOString() },
    };

    return { data, meta };
});
