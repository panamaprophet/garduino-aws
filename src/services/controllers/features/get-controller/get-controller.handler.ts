import { controllerParams, defineHandler, notFound } from '@/shared/http';
import { getController } from '../../entity/controller.api';
import { toControllerResponse } from '../../entity/controller.model';

const schema = { params: controllerParams };

export const handler = defineHandler(schema, async ({ params: { controllerId } }) => {
    const controller = (await getController(controllerId)) ?? notFound(`Controller "${controllerId}" not found`);

    const data = toControllerResponse(controller);

    return { data };
});
