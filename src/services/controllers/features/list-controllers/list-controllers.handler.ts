import { defineHandler } from '@/shared/http';
import { toControllerResponse } from '../../entity/controller.model';
import { listControllers } from '../../entity/controller.api';

export const handler = defineHandler({}, async ({ userId }) => {
    const controllers = await listControllers(userId);

    const data = controllers.map(toControllerResponse);

    return { data };
});
