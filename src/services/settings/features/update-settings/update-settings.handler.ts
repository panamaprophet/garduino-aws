import { controllerParams, defineHandler } from '@/shared/http';
import { publish } from '@/shared/mqtt';
import { merge } from '@/shared/object';
import { toDeviceSettings } from '../../entity/settings.model';
import { getSettings, saveSettings } from '../../entity/settings.api';
import { topics } from '../../settings.config';
import { updateSettingsSchema } from './update-settings.schema';

export const handler = defineHandler({ params: controllerParams, body: updateSettingsSchema }, async ({ params: { controllerId }, body }) => {
    const current = await getSettings(controllerId);
    const updated = merge(current, body);
    const settings = await saveSettings(controllerId, updated);
    const payload = toDeviceSettings(settings);

    await publish(topics.settings(controllerId), payload);

    const data = settings;

    return { data };
});
