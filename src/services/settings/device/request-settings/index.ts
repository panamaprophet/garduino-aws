import { defineMessageHandler } from '@/lib/device';
import { publish } from '@/lib/mqtt';
import { resolveSettings, toDeviceSettings } from '../../domain/settings';
import { findSettings } from '../../store/settings';
import { settingsRequestSchema } from './settings-request.schema';

export const handler = defineMessageHandler(settingsRequestSchema, async ({ controllerId }) => {
    const settings = resolveSettings(await findSettings(controllerId));

    return publish(`controllers/${controllerId}/settings`, toDeviceSettings(settings));
});
