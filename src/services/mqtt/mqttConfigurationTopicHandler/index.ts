import { decorateWithPayloadValidation, handleResponse } from '@/shared/helpers';
import { publish } from '@/shared/services/mqtt';


const getRequestUrl = (controllerId: string) => `${process.env.CONTROLLER_CONFIGURATION_URL}/configuration/${controllerId}`;

const getResponseTopic = (controllerId: string) => `controllers/${controllerId}/config/sub`;


const _handler = async (event: { controllerId: string }) => {
    const { controllerId } = event;
    const requestUrl = getRequestUrl(controllerId);
    const configuration = await fetch(requestUrl).then(response => response.json());

    if (!configuration) {
        return handleResponse({ error: 'no configuration found'}, 500);
    }

    await publish(getResponseTopic(controllerId), configuration);

    return handleResponse({ success: true });
};


export const handler = decorateWithPayloadValidation(_handler);
