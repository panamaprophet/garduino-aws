import { controllerParams, defineHandler } from '@/shared/http';
import { listEvents } from '../../entity/event.api';
import { toRangeResponse } from '../../entity/range.schema';
import { summarize } from './get-summary.model';
import { getSummarySchema } from './get-summary.schema';

const schema = { params: controllerParams, query: getSummarySchema };

export const handler = defineHandler(schema, async ({ params: { controllerId }, query }) => {
    const events = await listEvents(controllerId, query);

    const data = summarize(events, query);
    const range = toRangeResponse(query);
    const meta = { query: { ...range, interval: query.interval } };

    return { data, meta };
});
