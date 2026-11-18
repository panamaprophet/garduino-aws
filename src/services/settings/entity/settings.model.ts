import { Fan, fanDefaults } from './modules/fan.schema';
import { Light, lightDefaults } from './modules/light.schema';
import { Sensor, sensorDefaults } from './modules/sensor.schema';

export interface Settings {
    timezone: string;
    light: Light;
    fan: Fan;
    sensor: Sensor;
}

export interface SettingsPatch {
    timezone?: string;
    light?: Partial<Light>;
    fan?: Partial<Fan>;
    sensor?: Partial<Sensor>;
}

const defaultSettings: Settings = {
    timezone: 'UTC',
    light: lightDefaults,
    fan: fanDefaults,
    sensor: sensorDefaults,
};

export const applySettingsPatch = (settings: Settings, patch: SettingsPatch): Settings => ({
    timezone: patch.timezone ?? settings.timezone,
    light: { ...settings.light, ...patch.light },
    fan: { ...settings.fan, ...patch.fan },
    sensor: { ...settings.sensor, ...patch.sensor },
});

export const resolveSettings = (stored: SettingsPatch | null) => applySettingsPatch(defaultSettings, stored ?? {});

export const toDeviceSettings = (settings: Settings) => ({
    v: 2,
    light: settings.light,
    fan: settings.fan,
    sensor: settings.sensor,
});
