import { defineHandler, getPathParameter } from '@/lib/http';
import { parse } from '@/lib/validation';
import { requireController } from '@/services/configuration/lib';
import { getControllerEvents } from '../../lib/get-controller-events';
import { eventsQuerySchema } from './events-query.schema';

export const handler = defineHandler(async (event, { userId }) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const options = parse(eventsQuerySchema, event.queryStringParameters ?? {}, 'Invalid query parameters');

    await requireController(controllerId, userId);

    return getControllerEvents(controllerId, options);
});
