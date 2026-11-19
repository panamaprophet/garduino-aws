import { env } from '@/shared/env';
import { controllerParams, defineHandler } from '@/shared/http';
import { publish } from '@/shared/mqtt';
import { toDeviceCommand } from '../../entity/command.model';
import { topics } from '../../controllers.config';
import { sendCommandSchema } from './send-command.schema';

const firmwareBaseUrl = env('FIRMWARE_BASE_URL');

export const handler = defineHandler({ params: controllerParams, body: sendCommandSchema }, async ({ params: { controllerId }, body }) => {
    const payload = toDeviceCommand(body, firmwareBaseUrl);

    await publish(topics.commands(controllerId), payload);

    const data = { type: body.type, issuedAt: new Date().toISOString() };

    return { data, status: 202 };
});
