import { decorateWithPayloadValidation, handleResponse } from '../../../shared/helpers';


const getRequestUrl = (controllerId: string) => `${process.env.DATA_COLLECTOR_URL}/data/${controllerId}`;


const _handler = async (event: { controllerId: string, [k: string]: any }) => {
    const { controllerId, ...payload } = event;
    const requestUrl = getRequestUrl(controllerId);

    const result = await fetch(requestUrl, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });

    return handleResponse({ success: result });
};


export const handler = decorateWithPayloadValidation(_handler);
