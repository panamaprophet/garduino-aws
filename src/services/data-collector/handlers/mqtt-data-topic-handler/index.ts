import { Handler } from 'aws-lambda';
import { decorateWithPayloadValidation } from '@/lib/request';
import { addControllerEvent } from '../../lib/add-controller-event';

interface EventPayload {
    controllerId: string;
    payload: {
        [k: string]: unknown;
    };
}

const _handler: Handler<EventPayload> = async (event) => {
    const { controllerId, payload } = event;

    const result = await addControllerEvent(controllerId, payload);

    console.log('result:', { result });

    return { success: result };
};

export const handler = decorateWithPayloadValidation(_handler);
