import { controllerParams, defineHandler, notFound } from '@/shared/http';
import { toControllerResponse } from '../../entity/controller.model';
import { getController } from '../../entity/controller.api';

export const handler = defineHandler({ params: controllerParams }, async ({ params: { controllerId } }) => {
    const controller = await getController(controllerId) ?? notFound(`Controller "${controllerId}" not found`);

    const data = toControllerResponse(controller);

    return { data };
});
