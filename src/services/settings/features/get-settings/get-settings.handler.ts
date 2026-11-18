import { defineHandler, getPathParameter } from '@/shared/http';
import { resolveSettings } from '../../entity/settings.model';
import { findSettings } from '../../entity/settings.repository';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const stored = await findSettings(controllerId);

    return resolveSettings(stored);
});
