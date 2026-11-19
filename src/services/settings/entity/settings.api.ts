import { get, put } from '@/shared/db';
import { DeepPartial, merge } from '@/shared/object';
import { defaultSettings, Settings } from './settings.model';

interface StoredSettings extends DeepPartial<Settings> {
    controllerId: string;
    updatedAt: string;
}

export const getSettings = async (controllerId: string) => {
    const stored = await get<StoredSettings>(process.env.SETTINGS_TABLE, { controllerId });

    if (!stored) {
        return defaultSettings;
    }

    const { light, fan, sensor } = stored;

    return merge(defaultSettings, { light, fan, sensor });
};

export const saveSettings = async (controllerId: string, settings: Settings) => {
    await put(process.env.SETTINGS_TABLE, {
        ...settings,
        controllerId,
        updatedAt: new Date().toISOString(),
    });

    return settings;
};
