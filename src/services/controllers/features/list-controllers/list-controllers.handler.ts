import { defineHandler } from '@/shared/http';
import { listControllers } from '../../entity/controller.api';
import { toControllerResponse } from '../../entity/controller.model';

export const handler = defineHandler({}, async ({ userId }) => {
    const controllers = await listControllers(userId);

    const data = controllers.map(toControllerResponse);

    return { data };
});
