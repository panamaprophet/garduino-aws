import { defineHandler, getJsonBody, getPathParameter } from '@/shared/http';
import { parse } from '@/shared/validation';
import { applySettingsPatch, resolveSettings } from '../../entity/settings.model';
import { findSettings, saveSettings } from '../../entity/settings.repository';
import { updateSettingsSchema } from './update-settings.schema';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const patch = parse(updateSettingsSchema, getJsonBody(event), 'Invalid settings');

    const current = resolveSettings(await findSettings(controllerId));

    return saveSettings(controllerId, applySettingsPatch(current, patch));
});
