import { describe, expect, test } from '@jest/globals';
import { getTimeRelativeConfiguration } from './index';


describe('getTimeRelativeConfiguration', () => {
    describe('when valid time and duration passed', () => {
        test('should return valid configuration', () => {
            const refDate = new Date('2023-07-19 12:00Z');
            const result = getTimeRelativeConfiguration('12:00', 43200000, refDate);
            const expectedResult = {
                duration: 43200000,
                switchIn: 43200000,
                isOn: true,
            };

            expect(result).toEqual(expectedResult);
        });
    });

    describe('when off time crosses the midnight', () => {
        test('should return valid configuration', () => {
            const refDate = new Date('2023-07-19 12:00Z');
            const result = getTimeRelativeConfiguration('23:00', 43200000, refDate);
            const expectedResult = {
                duration: 43200000,
                switchIn: 39600000,
                isOn: false,
            };

            expect(result).toEqual(expectedResult);
        });
    });

    describe('when start time crosses the midnight', () => {
        test('should return valid configuration', () => {
            const refDate = new Date('2023-07-19 12:00Z');
            const result = getTimeRelativeConfiguration('01:00', 43200000, refDate);
            const expectedResult = {
                duration: 43200000,
                switchIn: 3600000,
                isOn: true,
            };

            expect(result).toEqual(expectedResult);
        });
    });
});
