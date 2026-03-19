import { decorateWithPayloadValidation } from '@/lib/request';
import { handleResponse } from '@/lib/response';
import { publish } from '@/lib/mqtt';
import { getControllerConfiguration } from '../lib';

const _handler = async (event: { controllerId: string }) => {
    const { controllerId } = event;

    const result = await getControllerConfiguration(controllerId);

    console.log('result:', { result });

    const responseTopic = `controllers/${controllerId}/config/sub`;

    await publish(responseTopic, result);

    return handleResponse({ success: true });
};


export const handler = decorateWithPayloadValidation(_handler);
