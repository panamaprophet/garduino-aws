import { defineHandler } from '@/shared/http';
import { toControllerResponse } from '../../entity/controller.model';
import { listControllersByOwner } from '../../entity/controller.api';

export const handler = defineHandler(async (_event, { userId }) => {
    const controllers = await listControllersByOwner(userId);

    return controllers.map(toControllerResponse);
});
