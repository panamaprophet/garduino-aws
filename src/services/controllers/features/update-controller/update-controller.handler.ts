import { notFoundError } from '@/shared/errors';
import { defineHandler, getJsonBody, getPathParameter } from '@/shared/http';
import { parse } from '@/shared/validation';
import { toControllerResponse } from '../../entity/controller.model';
import { updateController } from '../../entity/controller.api';
import { updateControllerSchema } from './update-controller.schema';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const changes = parse(updateControllerSchema, getJsonBody(event), 'Invalid controller');
    const controller = await updateController(controllerId, changes);

    if (!controller) {
        throw notFoundError(`Controller "${controllerId}" not found`);
    }

    return toControllerResponse(controller);
});
