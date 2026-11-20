import { controllerParams, defineHandler } from '@/shared/http';
import { listLatestEvents } from '../../entity/event.api';
import { toEventResponse } from '../../entity/event.model';

const schema = { params: controllerParams };

export const handler = defineHandler(schema, async ({ params: { controllerId } }) => {
    const events = await listLatestEvents(controllerId);

    const entries = events.map((event) => [event.type, toEventResponse(event)]);
    const data = Object.fromEntries(entries);

    return { data };
});
