import { addMilliseconds, compareDesc, differenceInMilliseconds, subDays } from 'date-fns';


const pad = (n: any, symbol = '0', length = 2) => String(n).padStart(length, symbol);

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

    const dateString = `${refDate.getFullYear()}-${pad(refDate.getMonth() + 1)}-${pad(refDate.getDate())}T${pad(onHours)}:${pad(onMinutes)}Z`;

    let onTime = new Date(dateString);
    let offTime = addMilliseconds(onTime, duration);

    const offHours = offTime.getHours();

    if (offHours < onHours && offHours > refDate.getHours()) {
        onTime = subDays(onTime, 1);
        offTime = subDays(offTime, 1);
    }

    const isOn = compareDesc(onTime, refDate) >= 0 && compareDesc(offTime, refDate) < 0;
    const switchIn = differenceInMilliseconds(isOn ? offTime : onTime, refDate);

    return {
        isOn,
        duration,
        switchIn,
    };
};
