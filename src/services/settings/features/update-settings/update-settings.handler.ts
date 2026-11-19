import { defineHandler, getJsonBody, getPathParameter } from '@/shared/http';
import { publish } from '@/shared/mqtt';
import { merge } from '@/shared/object';
import { parse } from '@/shared/validation';
import { toDeviceSettings } from '../../entity/settings.model';
import { getSettings, saveSettings } from '../../entity/settings.api';
import { topics } from '../../settings.config';
import { updateSettingsSchema } from './update-settings.schema';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const body = getJsonBody(event);

    const changes = parse(updateSettingsSchema, body, 'Invalid settings');
    const current = await getSettings(controllerId);
    const updated = merge(current, changes);
    const settings = await saveSettings(controllerId, updated);
    const payload = toDeviceSettings(settings);

    await publish(topics.settings(controllerId), payload);

    return settings;
});
