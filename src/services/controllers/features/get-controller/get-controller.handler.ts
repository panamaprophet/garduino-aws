import { notFoundError } from '@/shared/errors';
import { defineHandler, getPathParameter } from '@/shared/http';
import { getController } from '../../entity/controller.api';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const controller = await getController(controllerId);

    if (!controller) {
        throw notFoundError(`Controller "${controllerId}" not found`);
    }

    return controller;
});
