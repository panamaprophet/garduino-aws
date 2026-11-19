import { z } from 'zod';
import { validationError } from '@/shared/errors';

export const parse = <T extends z.ZodType>(
    schema: T,
    input: unknown,
    errorMessage = 'Invalid request'
): z.output<T> => {
    const result = schema.safeParse(input);

    if (!result.success) {
        const details = result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
        }));

        throw validationError(errorMessage, details);
    }

    return result.data;
};
