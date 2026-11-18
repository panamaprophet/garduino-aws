import { defineHandler, getPathParameter } from '@/shared/http';
import { resolveSettings } from '../../entity/settings.model';
import { getSettings } from '../../entity/settings.api';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const stored = await getSettings(controllerId);

    return resolveSettings(stored);
});
