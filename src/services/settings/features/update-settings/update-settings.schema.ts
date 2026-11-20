import { z } from 'zod';
import { fanSchema } from '../../entity/modules/fan.schema';
import { lightSchema } from '../../entity/modules/light.schema';
import { sensorSchema } from '../../entity/modules/sensor.schema';

export const updateSettingsSchema = z.strictObject({
    light: lightSchema.partial().optional(),
    fan: fanSchema.partial().optional(),
    sensor: sensorSchema.partial().optional(),
});
