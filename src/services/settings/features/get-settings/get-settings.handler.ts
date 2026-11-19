import { controllerParams, defineHandler } from '@/shared/http';
import { getSettings } from '../../entity/settings.api';

export const handler = defineHandler({ params: controllerParams }, async ({ params: { controllerId } }) => {
    const data = await getSettings(controllerId);

    return { data };
});
