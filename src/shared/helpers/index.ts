import { differenceInMilliseconds } from 'date-fns';


const isNumber = (n: any): n is number => !isNaN(parseInt(n, 10));


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
