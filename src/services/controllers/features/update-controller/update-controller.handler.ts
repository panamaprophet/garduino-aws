import { controllerParams, defineHandler, notFound } from '@/shared/http';
import { updateController } from '../../entity/controller.api';
import { toControllerResponse } from '../../entity/controller.model';
import { controllerSchema } from '../../entity/controller.schema';

const schema = { params: controllerParams, body: controllerSchema };

export const handler = defineHandler(schema, async ({ params: { controllerId }, body }) => {
    const controller = (await updateController(controllerId, body)) ?? notFound(`Controller "${controllerId}" not found`);

    const data = toControllerResponse(controller);

    return { data };
});
