import { defineHandler, getJsonBody, getPathParameter } from '@/lib/http';
import { parse } from '@/lib/validation';
import { applySettingsPatch, resolveSettings } from '../../domain/settings';
import { findSettings, saveSettings } from '../../store/settings';
import { settingsPatchSchema } from './settings.schema';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const patch = parse(settingsPatchSchema, getJsonBody(event), 'Invalid settings');

    const current = resolveSettings(await findSettings(controllerId));

    return saveSettings(controllerId, applySettingsPatch(current, patch));
});
