import { defineHandler, getJsonBody, getPathParameter } from '@/lib/http';
import { parse } from '@/lib/validation';
import { requireController } from '@/services/configuration/lib';
import { addControllerEvent } from '../../lib/add-controller-event';
import { eventSchema } from './event.schema';

export const handler = defineHandler(async (event, { userId }) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const payload = parse(eventSchema, getJsonBody(event), 'Event payload must be a JSON object');

    await requireController(controllerId, userId);

    return addControllerEvent(controllerId, payload);
});
