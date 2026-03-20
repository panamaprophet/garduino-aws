import { IoTEvent } from 'aws-lambda';

const isValidEvent = (event: any): event is IoTEvent<{ controllerId: string, [k: string]: any }> => (typeof event === 'object') && 'controllerId' in event;

export const decorateWithPayloadValidation = (handler: any) => (event: any) => {
    if (!isValidEvent(event)) {
        console.log(`invalid payload: expecting object, received ${(typeof event)}`);

        return { error: 'invalid payload' };
    }

    return handler(event);
};
