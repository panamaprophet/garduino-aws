import { notFoundError } from '@/shared/errors';
import { defineHandler, getPathParameter } from '@/shared/http';
import { findController, removeController } from '../../entity/controller.repository';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const controller = await findController(controllerId);

    if (!controller) {
        throw notFoundError(`Controller "${controllerId}" not found`);
    }

    return removeController(controller);
});
