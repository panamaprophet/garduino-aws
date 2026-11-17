import { z } from 'zod';

export const sensorSchema = z.object({
    thresholdTemperature: z.number().int().min(0).max(100),
});

export type Sensor = z.output<typeof sensorSchema>;

export const sensorDefaults: Sensor = {
    thresholdTemperature: 30,
};
