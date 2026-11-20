import { z } from 'zod';
import { fanSchema } from '../../entity/modules/fan.schema';
import { lightSchema } from '../../entity/modules/light.schema';
import { sensorSchema } from '../../entity/modules/sensor.schema';

const telemetrySchema = z.object({
    type: z.literal('telemetry'),
    light: lightSchema.optional(),
    fan: fanSchema.optional(),
    sensor: sensorSchema.optional(),
});

const lightChangeSchema = z.object({ type: z.literal('light:change'), light: lightSchema });
const fanChangeSchema = z.object({ type: z.literal('fan:change'), fan: fanSchema });
const sensorChangeSchema = z.object({ type: z.literal('sensor:change'), sensor: sensorSchema });

const bootSchema = z.object({
    type: z.literal('boot'),
    firmwareVersion: z.string(),
    protocolVersion: z.int(),
    modules: z.array(z.string()),
    resetReason: z.string(),
});

const connectionSchema = z.object({
    type: z.literal('connection'),
    online: z.boolean(),
    reason: z.string().optional(),
});

const settingsAppliedSchema = z.object({
    type: z.literal('settings:applied'),
});

const firmwareUpdateSchema = z.object({
    type: z.literal('firmware:update'),
    status: z.enum(['started', 'success', 'error']),
    message: z.string().optional(),
});

export const reportEventSchema = z.object({
    controllerId: z.string().min(1),
    receivedAt: z.int().nonnegative(),
    payload: z.discriminatedUnion('type', [
        telemetrySchema,
        lightChangeSchema,
        fanChangeSchema,
        sensorChangeSchema,
        bootSchema,
        connectionSchema,
        settingsAppliedSchema,
        firmwareUpdateSchema,
    ]),
});
