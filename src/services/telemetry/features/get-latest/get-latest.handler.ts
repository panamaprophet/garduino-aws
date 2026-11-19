import { controllerParams, defineHandler } from '@/shared/http';
import { toEventResponse } from '../../entity/event.model';
import { listLatestEvents } from '../../entity/event.api';

export const handler = defineHandler({ params: controllerParams }, async ({ params: { controllerId } }) => {
    const events = await listLatestEvents(controllerId);

    const entries = events.map((event) => [event.type, toEventResponse(event)]);
    const data = Object.fromEntries(entries);

    return { data };
});
