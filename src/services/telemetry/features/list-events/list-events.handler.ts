import { controllerParams, defineHandler, toCursor } from '@/shared/http';
import { toEventResponse } from '../../entity/event.model';
import { listEventsPage } from '../../entity/event.api';
import { toRangeResponse } from '../../entity/range.schema';
import { listEventsSchema } from './list-events.schema';

export const handler = defineHandler({ params: controllerParams, query: listEventsSchema }, async ({ params: { controllerId }, query }) => {
    const { items, lastKey } = await listEventsPage(controllerId, query);

    const data = items.map(toEventResponse);
    const nextCursor = lastKey ? toCursor({ ...query, lastKey }) : null;
    const pagination = { nextCursor, limit: query.limit };
    const meta = { pagination, query: toRangeResponse(query) };

    return { data, meta };
});
