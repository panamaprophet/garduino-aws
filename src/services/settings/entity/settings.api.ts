import { table } from '@/shared/db';
import { DeepPartial, merge } from '@/shared/object';
import { defaultSettings, Settings } from './settings.model';

interface StoredSettings extends DeepPartial<Settings> {
    controllerId: string;
    updatedAt: string;
}

const settingsTable = table<StoredSettings>('SETTINGS_TABLE');

export const getSettings = async (controllerId: string) => {
    const stored = await settingsTable.get({ controllerId });

    if (!stored) {
        return defaultSettings;
    }

    const { light, fan, sensor } = stored;

    return merge(defaultSettings, { light, fan, sensor });
};

export const saveSettings = async (controllerId: string, settings: Settings) => {
    const updatedAt = new Date().toISOString();

    await settingsTable.put({ ...settings, controllerId, updatedAt });

    return settings;
};
