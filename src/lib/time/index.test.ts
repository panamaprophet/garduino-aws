import { describe, expect, test } from '@jest/globals';
import { getTimeRelativeConfiguration } from './index';
import { hoursToMilliseconds } from 'date-fns';

describe('getTimeRelativeConfiguration', () => {
    describe('when reference date equals on time', () => {
        test('switchIn should equals duration', () => {
            const refDate = new Date('2024-01-01 12:00Z');

            const duration = hoursToMilliseconds(15);
            const switchIn = hoursToMilliseconds(15);
            const isOn = true;
            const onTime = '12:00';

            const result = getTimeRelativeConfiguration(onTime, duration, refDate);

            const expectedResult = {
                switchIn,
                duration,
                isOn,
            };

            expect(result).toEqual(expectedResult);
        });
    });

    describe('when on time in the future', () => {
        describe('when on time tomorrow', () => {
            test('should return valid configuration', () => {
                const referenceDate = new Date('2023-07-19 12:00Z');

                const duration = hoursToMilliseconds(12);
                const switchIn = hoursToMilliseconds(1);

                const onTime = '01:00';
                const isOn = true;

                const result = getTimeRelativeConfiguration(onTime, duration, referenceDate);

                const expectedResult = {
                    duration,
                    switchIn,
                    isOn,
                };

                expect(result).toEqual(expectedResult);
            });
        });

        describe('when on time later today (now after 12 pm)', () => {
            test('should return valid configuration', () => {
                const refDate = new Date('2023-07-19 13:00Z');

                const onTime = '23:00';
                const duration = hoursToMilliseconds(12);

                const isOn = false;
                const switchIn = hoursToMilliseconds(10);

                const result = getTimeRelativeConfiguration(onTime, duration, refDate);

                const expectedResult = {
                    duration,
                    switchIn,
                    isOn,
                };

                expect(result).toEqual(expectedResult);
            });
        });

        describe('when on time later today (now before 12 pm)', () => {
            test('should return valid configuration', () => {
                const referenceDate = new Date('2023-10-04 04:00Z');

                const onTime = '19:00';
                const isOn = true;
                const duration = hoursToMilliseconds(19); // 68400000 ms
                const switchIn = hoursToMilliseconds(10);

                const result = getTimeRelativeConfiguration(onTime, duration, referenceDate);

                const expectedResult = {
                    duration,
                    switchIn,
                    isOn,
                };

                expect(result).toEqual(expectedResult);
            });
        });

        // when on time less than the current time of reference date — porbably it's not fixed
    });

    describe('when on time in the past', () => {
        test('should return valid configuration', () => {
            const refDate = new Date('2024-02-12 01:00Z');

            const duration = hoursToMilliseconds(18);
            const switchIn = hoursToMilliseconds(12);
            const onTime = '19:00';
            const isOn = true;

            const result = getTimeRelativeConfiguration(onTime, duration, refDate);

            const expectedResult = {
                duration,
                switchIn,
                isOn,
            };

            expect(result).toEqual(expectedResult);
        });
    });
});
