import { IoTEvent } from 'aws-lambda';
import { differenceInMilliseconds } from 'date-fns';


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

// @todo: revisit this function, it copied from the old repo as is and looks ugly
export const getTimeRelativeConfiguration = (time: string, duration: number, refDate = new Date()) => {
    const [onHours, onMinutes] = time.split(':').map(Number);

    if (!isNumber(onHours) || !isNumber(onMinutes)) {
        return null;
    }

    const onTime = new Date();

    onTime.setUTCHours(onHours);
    onTime.setUTCMinutes(onMinutes);

    const offTime = new Date(onTime.getTime() / 1000 + duration);
    const isOn = refDate > onTime && refDate < offTime;

    if (refDate > onTime && refDate > offTime) {
        onTime.setUTCDate(onTime.getUTCDate() + 1);
    }

    const switchIn = isOn
        ? (duration - differenceInMilliseconds(refDate, offTime))
        : differenceInMilliseconds(onTime, refDate);

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
