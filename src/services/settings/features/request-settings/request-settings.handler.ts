import { defineMessageHandler, publish } from '@/shared/mqtt';
import { toDeviceSettings } from '../../entity/settings.model';
import { getSettings } from '../../entity/settings.api';
import { topics } from '../../settings.config';
import { requestSettingsSchema } from './request-settings.schema';

export const handler = defineMessageHandler(requestSettingsSchema, async ({ controllerId }) => {
    const settings = await getSettings(controllerId);

    return publish(
        topics.settings(controllerId),
        toDeviceSettings(settings)
    );
});
