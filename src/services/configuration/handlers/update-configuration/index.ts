import { defineHandler, getJsonBody, getPathParameter } from '@/lib/http';
import { parse } from '@/lib/validation';
import { requireController, updateControllerConfiguration } from '../../lib';
import { configurationSchema } from './configuration.schema';

export const handler = defineHandler(async (event, { userId }) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const input = parse(configurationSchema, getJsonBody(event), 'Invalid configuration');

    const current = await requireController(controllerId, userId);

    return updateControllerConfiguration(current, input);
});
