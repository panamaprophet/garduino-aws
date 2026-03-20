import { decorateWithPayloadValidation } from '@/lib/request';
import { addControllerEvent } from '../../lib/add-controller-event';

const _handler = async (event: { controllerId: string, [k: string]: unknown }) => {
    const { controllerId, ...payload } = event;

    const result = await addControllerEvent(controllerId, payload);

    console.log('result:', { result });

    return { success: result };
};

export const handler = decorateWithPayloadValidation(_handler);
