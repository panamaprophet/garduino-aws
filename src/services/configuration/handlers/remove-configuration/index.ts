import { defineHandler, getPathParameter } from '@/lib/http';
import { removeControllerConfiguration, requireController } from '../../lib';

export const handler = defineHandler(async (event, { userId }) => {
    const controllerId = getPathParameter(event, 'controllerId');

    await requireController(controllerId, userId);

    const result = await removeControllerConfiguration(controllerId);

    return { success: result };
});
