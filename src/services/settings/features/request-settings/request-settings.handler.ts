import { defineMessageHandler } from '@/shared/device';
import { publish } from '@/shared/mqtt';
import { resolveSettings, toDeviceSettings } from '../../entity/settings.model';
import { findSettings } from '../../entity/settings.repository';
import { topics } from '../../settings.config';
import { requestSettingsSchema } from './request-settings.schema';

export const handler = defineMessageHandler(requestSettingsSchema, async ({ controllerId }) => {
    const settings = resolveSettings(await findSettings(controllerId));

    return publish(topics.settings(controllerId), toDeviceSettings(settings));
});
