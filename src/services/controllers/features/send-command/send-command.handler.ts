import { env } from '@/shared/env';
import { controllerParams, defineHandler } from '@/shared/http';
import { publish } from '@/shared/mqtt';
import { topics } from '../../controllers.config';
import { toDeviceCommand } from '../../entity/command.model';
import { commandSchema } from '../../entity/command.schema';

const firmwareBaseUrl = env('FIRMWARE_BASE_URL');

const schema = { params: controllerParams, body: commandSchema };

export const handler = defineHandler(schema, async ({ params: { controllerId }, body }) => {
    const payload = toDeviceCommand(body, firmwareBaseUrl);

    await publish(topics.commands(controllerId), payload);

    const data = { type: body.type, issuedAt: new Date().toISOString() };

    return { data, status: 202 };
});
