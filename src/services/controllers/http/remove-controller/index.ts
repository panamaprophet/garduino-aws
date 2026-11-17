import { notFoundError } from '@/lib/errors';
import { defineHandler, getPathParameter } from '@/lib/http';
import { isAccessibleBy } from '../../domain/controller';
import { findController, removeController } from '../../store/controllers';

export const handler = defineHandler(async (event, { userId }) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const controller = await findController(controllerId);

    if (!isAccessibleBy(controller, userId)) {
        throw notFoundError(`Controller "${controllerId}" not found`);
    }

    return removeController(controller);
});
