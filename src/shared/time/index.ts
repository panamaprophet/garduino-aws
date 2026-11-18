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

    return {
        isOn,
        switchIn,
        duration,
    };
};
