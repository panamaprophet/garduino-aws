import { Handler } from 'aws-lambda';
import { decorateWithPayloadValidation } from '@/lib/request';
import { publish } from '@/lib/mqtt';
import { getControllerConfiguration } from '../../lib';

interface EventPayload {
    controllerId: string;
}

const _handler: Handler<EventPayload> = async (event) => {
    const { controllerId } = event;

    const result = await getControllerConfiguration(controllerId);

    console.log('result:', { result });

    const responseTopic = `controllers/${controllerId}/config/sub`;

    await publish(responseTopic, result);

    return { success: true };
};

export const handler = decorateWithPayloadValidation(_handler);
