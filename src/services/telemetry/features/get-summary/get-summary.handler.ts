import { defineHandler, getPathParameter, respond } from '@/shared/http';
import { parse } from '@/shared/validation';
import { listEvents } from '../../entity/event.api';
import { getSummarySchema } from './get-summary.schema';
import { summarize } from './get-summary.model';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const query = event.queryStringParameters ?? {};

    const params = parse(getSummarySchema, query, 'Invalid query parameters');
    const events = await listEvents(controllerId, params);
    const buckets = summarize(events, params);

    const meta = {
        query: {
            from: new Date(params.from).toISOString(),
            to: new Date(params.to).toISOString(),
            interval: params.interval,
        },
    };

    return respond(buckets, { meta });
});
