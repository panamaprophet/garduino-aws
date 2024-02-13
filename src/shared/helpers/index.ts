import { IoTEvent } from 'aws-lambda';
import {
    addDays,
    addMilliseconds,
    differenceInMilliseconds,
    isAfter,
    isBefore,
    isEqual,
    parse,
    startOfDay,
    subDays,
} from 'date-fns';

const isValidEvent = (event: any): event is IoTEvent<{ controllerId: string, [k: string]: any }> => (typeof event === 'object') && 'controllerId' in event;

export const handleResponse = (body: any, statusCode = 200, headers = {}) => ({
    statusCode,
    body: JSON.stringify(body),
    headers: {
        'Access-Control-Allow-Origin': '*',
        ...headers,
    }
});

export const getTimeRelativeConfiguration = (time: string, duration: number, referenceDate = new Date()) => {
    let onTime = parse(`${time} Z`, 'HH:mm X', startOfDay(referenceDate));
    let offTime = addMilliseconds(onTime, duration);

    if (isAfter(onTime, referenceDate)) {
        onTime = subDays(onTime, 1);
        offTime = addMilliseconds(onTime, duration);
    }

    if (isBefore(offTime, referenceDate)) {
        onTime = addDays(onTime, 1);
        offTime = addMilliseconds(onTime, duration);
    }

    const isOn =
        (isAfter(referenceDate, onTime) || isEqual(referenceDate, onTime)) &&
        (isBefore(referenceDate, offTime) || isEqual(referenceDate, offTime));

    const switchIn = isOn
        ? differenceInMilliseconds(offTime, referenceDate)
        : differenceInMilliseconds(onTime, referenceDate);

    // console.log('onTime: %s\noffTime: %s\ncurrentTime: %s\nisOn: %s\n', onTime, offTime, referenceDate, isOn);

    return {
        isOn,
        switchIn,
        duration,
    };
};

export const decorateWithPayloadValidation = (handler: any) => (event: any) => {
    if (!isValidEvent(event)) {
        console.log(`invalid payload: expecting object, received ${(typeof event)}`);

        return handleResponse({ error: 'invalid payload' }, 500);
    }

    return handler(event);
};
