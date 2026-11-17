import { defineHandler } from '@/lib/http';
import { getControllerIdsByOwnerId } from '../../lib';

export const handler = defineHandler(async (_event, { userId }) => {
    const controllerIds = await getControllerIdsByOwnerId(userId);

    return controllerIds ?? [];
});
