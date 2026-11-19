import { defineHandler, getJsonBody, getPathParameter, respond } from '@/shared/http';
import { publish } from '@/shared/mqtt';
import { parse } from '@/shared/validation';
import { toDeviceCommand } from '../../entity/command.model';
import { topics } from '../../controllers.config';
import { sendCommandSchema } from './send-command.schema';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const command = parse(sendCommandSchema, getJsonBody(event), 'Invalid command');

    await publish(topics.commands(controllerId), toDeviceCommand(command, process.env.FIRMWARE_BASE_URL!));

    return respond({ type: command.type, issuedAt: new Date().toISOString() }, { statusCode: 202 });
});
