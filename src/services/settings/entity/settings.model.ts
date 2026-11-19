import { Fan, fanDefaults } from './modules/fan.schema';
import { Light, lightDefaults } from './modules/light.schema';
import { Sensor, sensorDefaults } from './modules/sensor.schema';

export interface Settings {
    light: Light;
    fan: Fan;
    sensor: Sensor;
}

export const defaultSettings: Settings = {
    light: lightDefaults,
    fan: fanDefaults,
    sensor: sensorDefaults,
};

export const toDeviceSettings = (settings: Settings) => ({ v: 2, ...settings });
