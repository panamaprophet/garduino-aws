import { defineHandler, getPathParameter } from '@/lib/http';
import { resolveSettings } from '../../domain/settings';
import { findSettings } from '../../store/settings';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const stored = await findSettings(controllerId);

    return resolveSettings(stored);
});
