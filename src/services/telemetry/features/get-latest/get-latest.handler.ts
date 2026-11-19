import { defineHandler, getPathParameter } from '@/shared/http';
import { toEventResponse } from '../../entity/event.model';
import { listLatestEvents } from '../../entity/event.api';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');

    const events = await listLatestEvents(controllerId);

    const entries = events.map((item) => [item.type, toEventResponse(item)]);

    return Object.fromEntries(entries);
});
