import { z } from 'zod';
import { validationError } from '@/lib/errors';

export const parse = <T extends z.ZodType>(schema: T, input: unknown, message = 'Invalid request'): z.output<T> => {
    const result = schema.safeParse(input);

    if (!result.success) {
        const details = result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
        }));

        throw validationError(message, details);
    }

    return result.data;
};
