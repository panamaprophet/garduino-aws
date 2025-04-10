import { decorateWithPayloadValidation, handleResponse } from '@/shared/helpers';
import { addControllerEvent } from '@/shared/services/data-сollector';

const _handler = async (event: { controllerId: string, [k: string]: unknown }) => {
    const { controllerId, ...payload } = event;

    const result = await addControllerEvent(controllerId, payload);

    console.log('result:', { result });

    return handleResponse({ success: result });
};

export const handler = decorateWithPayloadValidation(_handler);
