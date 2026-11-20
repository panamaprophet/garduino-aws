import { controllerParams, defineHandler } from '@/shared/http';
import { listEvents } from '../../entity/event.api';
import { toRangeResponse } from '../../entity/range.schema';
import { getSummarySchema } from './get-summary.schema';
import { summarize } from './get-summary.model';

export const handler = defineHandler({ params: controllerParams, query: getSummarySchema }, async ({ params: { controllerId }, query }) => {
    const events = await listEvents(controllerId, query);

    const data = summarize(events, query);
    const range = toRangeResponse(query);
    const meta = { query: { ...range, interval: query.interval } };

    return { data, meta };
});
