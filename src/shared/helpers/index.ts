import { IoTEvent } from 'aws-lambda';
import { addDays, addMilliseconds, differenceInMilliseconds, parse } from 'date-fns';


const isNumber = (n: any): n is number => !isNaN(parseInt(n, 10));

const isValidEvent = (event: any): event is IoTEvent<{ controllerId: string, [k: string]: any }> => (typeof event === 'object') && 'controllerId' in event;


export const handleResponse = (body: any, statusCode = 200, headers = {}) => ({
    statusCode,
    body: JSON.stringify(body),
    headers: {
        'Access-Control-Allow-Origin': '*',
        ...headers,
    }
});

export const getTimeRelativeConfiguration = (time: string, duration: number, refDate = new Date()) => {
    let onTime = parse(`${time} Z`, 'HH:mm X', refDate);
    let offTime = addMilliseconds(onTime, duration);

    const isOn = (refDate >= onTime && refDate <= offTime);

    if (offTime < refDate) {
        onTime = addDays(onTime, 1);
    }

    const switchIn = isOn
        ? duration - differenceInMilliseconds(refDate, onTime)
        : differenceInMilliseconds(onTime, refDate);

    console.log('onTime: %s\noffTime: %s\ncurrentTime: %s\nisOn: %s\n', onTime, offTime, refDate, isOn);

    return {
        isOn,
        duration,
        switchIn,
    };
};

export const decorateWithPayloadValidation = (handler: any) => (event: any) => {
    if (!isValidEvent(event)) {
        console.log(`invalid payload: expecting object, received ${(typeof event)}`);

        return handleResponse({ error: 'invalid payload' }, 500);
    }

    return handler(event);
};
