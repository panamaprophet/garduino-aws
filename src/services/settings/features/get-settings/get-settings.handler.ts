import { controllerParams, defineHandler } from '@/shared/http';
import { getSettings } from '../../entity/settings.api';

const schema = { params: controllerParams };

export const handler = defineHandler(schema, async ({ params: { controllerId } }) => {
    const data = await getSettings(controllerId);

    return { data };
});
