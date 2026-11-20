import { controllerParams, defineHandler, toCursor } from '@/shared/http';
import { listEventsPage } from '../../entity/event.api';
import { toEventResponse } from '../../entity/event.model';
import { toRangeResponse } from '../../entity/range.schema';
import { listEventsSchema } from './list-events.schema';

const schema = { params: controllerParams, query: listEventsSchema };

export const handler = defineHandler(schema, async ({ params: { controllerId }, query }) => {
    const { items, lastKey } = await listEventsPage(controllerId, query);

    const data = items.map(toEventResponse);
    const nextCursor = lastKey ? toCursor({ ...query, lastKey }) : null;
    const pagination = { nextCursor, limit: query.limit };
    const meta = { pagination, query: toRangeResponse(query) };

    return { data, meta };
});
