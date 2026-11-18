import { defineHandler, getPathParameter } from '@/shared/http';
import { removeController } from '../../entity/controller.api';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');

    return removeController(controllerId);
});
