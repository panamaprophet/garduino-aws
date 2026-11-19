import { controllerParams, defineHandler, notFound } from '@/shared/http';
import { toControllerResponse } from '../../entity/controller.model';
import { updateController } from '../../entity/controller.api';
import { updateControllerSchema } from './update-controller.schema';

export const handler = defineHandler({ params: controllerParams, body: updateControllerSchema }, async ({ params: { controllerId }, body }) => {
    const controller = await updateController(controllerId, body) ?? notFound(`Controller "${controllerId}" not found`);

    const data = toControllerResponse(controller);

    return { data };
});
