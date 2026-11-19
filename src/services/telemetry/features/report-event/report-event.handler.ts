import { defineMessageHandler } from '@/shared/device';
import { createEvent } from '../../entity/event.model';
import { saveEvent, saveLatestEvent } from '../../entity/event.api';
import { reportEventSchema } from './report-event.schema';

export const handler = defineMessageHandler(reportEventSchema, async ({ controllerId, receivedAt, payload }) => {
    const event = createEvent(controllerId, receivedAt, payload);
    const saved = await saveEvent(event);

    return saveLatestEvent(saved);
});
