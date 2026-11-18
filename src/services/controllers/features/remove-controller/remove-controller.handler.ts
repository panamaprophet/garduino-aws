import { notFoundError } from '@/shared/errors';
import { defineHandler, getPathParameter } from '@/shared/http';
import { isAccessibleBy } from '../../entity/controller.model';
import { findController, removeController } from '../../entity/controller.repository';

export const handler = defineHandler(async (event, { userId }) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const controller = await findController(controllerId);

    if (!isAccessibleBy(controller, userId)) {
        throw notFoundError(`Controller "${controllerId}" not found`);
    }

    return removeController(controller);
});
