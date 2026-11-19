import { controllerParams, defineHandler, notFound } from '@/shared/http';
import { toControllerResponse } from '../../entity/controller.model';
import { controllerSchema } from '../../entity/controller.schema';
import { updateController } from '../../entity/controller.api';

export const handler = defineHandler({ params: controllerParams, body: controllerSchema }, async ({ params: { controllerId }, body }) => {
    const controller = await updateController(controllerId, body) ?? notFound(`Controller "${controllerId}" not found`);

    const data = toControllerResponse(controller);

    return { data };
});
