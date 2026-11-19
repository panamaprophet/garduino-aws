import { defineHandler, getJsonBody, getPathParameter, respond } from '@/shared/http';
import { publish } from '@/shared/mqtt';
import { parse } from '@/shared/validation';
import { toDeviceCommand } from '../../entity/command.model';
import { topics } from '../../controllers.config';
import { sendCommandSchema } from './send-command.schema';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const body = getJsonBody(event);

    const command = parse(sendCommandSchema, body, 'Invalid command');
    const payload = toDeviceCommand(command, process.env.FIRMWARE_BASE_URL!);

    await publish(topics.commands(controllerId), payload);

    const response = { type: command.type, issuedAt: new Date().toISOString() };

    return respond(response, { statusCode: 202 });
});
