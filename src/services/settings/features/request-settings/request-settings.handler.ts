import { defineMessageHandler, publish } from '@/shared/mqtt';
import { getSettings } from '../../entity/settings.api';
import { toDeviceSettings } from '../../entity/settings.model';
import { topics } from '../../settings.config';
import { requestSettingsSchema } from './request-settings.schema';

export const handler = defineMessageHandler(requestSettingsSchema, async ({ controllerId }) => {
    const settings = await getSettings(controllerId);
    const payload = toDeviceSettings(settings);

    return publish(topics.settings(controllerId), payload);
});
