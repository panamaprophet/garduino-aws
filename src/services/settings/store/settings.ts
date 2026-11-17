import { get, put } from '@/lib/db';
import { Settings, SettingsPatch } from '../domain/settings';

interface StoredSettings extends SettingsPatch {
    controllerId: string;
    updatedAt: string;
}

export const findSettings = async (controllerId: string): Promise<SettingsPatch | null> => {
    const stored = await get<StoredSettings>(process.env.SETTINGS_TABLE, { controllerId });

    if (!stored) {
        return null;
    }

    const { timezone, light, fan, sensor } = stored;

    return { timezone, light, fan, sensor };
};

export const saveSettings = async (controllerId: string, settings: Settings) => {
    await put(process.env.SETTINGS_TABLE, {
        ...settings,
        controllerId,
        updatedAt: new Date().toISOString(),
    });

    return settings;
};
