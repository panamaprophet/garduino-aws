import { defineHandler, getPathParameter } from '@/shared/http';
import { getSettings } from '../../entity/settings.api';

export const handler = defineHandler((event) => {
    const controllerId = getPathParameter(event, 'controllerId');

    return getSettings(controllerId);
});
