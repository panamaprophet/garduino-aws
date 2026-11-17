import { z } from 'zod';
import { fanSchema } from '../../modules/fan/fan.schema';
import { lightSchema } from '../../modules/light/light.schema';
import { sensorSchema } from '../../modules/sensor/sensor.schema';

const isTimeZone = (value: string) => {
    try {
        new Intl.DateTimeFormat('en', { timeZone: value });

        return true;
    } catch {
        return false;
    }
};

export const settingsPatchSchema = z.strictObject({
    timezone: z.string().refine(isTimeZone, { error: 'must be an IANA time zone name, e.g. Europe/Berlin' }).optional(),
    light: lightSchema.partial().optional(),
    fan: fanSchema.partial().optional(),
    sensor: sensorSchema.partial().optional(),
});
