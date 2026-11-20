import { controllerParams, defineHandler } from '@/shared/http';
import { publish } from '@/shared/mqtt';
import { merge } from '@/shared/object';
import { getSettings, saveSettings } from '../../entity/settings.api';
import { toDeviceSettings } from '../../entity/settings.model';
import { topics } from '../../settings.config';
import { updateSettingsSchema } from './update-settings.schema';

const schema = { params: controllerParams, body: updateSettingsSchema };

export const handler = defineHandler(schema, async ({ params: { controllerId }, body }) => {
    const current = await getSettings(controllerId);
    const updated = merge(current, body);
    const settings = await saveSettings(controllerId, updated);
    const payload = toDeviceSettings(settings);

    await publish(topics.settings(controllerId), payload);

    const data = settings;

    return { data };
});
