import { decorateWithPayloadValidation, handleResponse } from '@/shared/helpers';
import { getControllerConfiguration } from '@/shared/services/configuration';
import { publish } from '@/shared/services/mqtt';

const _handler = async (event: { controllerId: string }) => {
    const { controllerId } = event;

    const result = await getControllerConfiguration(controllerId);

    console.log('result:', { result });

    const responseTopic = `controllers/${controllerId}/config/sub`;

    await publish(responseTopic, result);

    return handleResponse({ success: true });
};


export const handler = decorateWithPayloadValidation(_handler);
