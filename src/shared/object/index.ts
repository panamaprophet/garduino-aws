export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends unknown[] ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const merge = <T extends object>(target: T, patch: DeepPartial<T>): T => {
    const result = { ...target } as Record<string, unknown>;

    for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) {
            continue;
        }

        const current = result[key];

        result[key] = isPlainObject(current) && isPlainObject(value) ? merge(current, value) : value;
    }

    return result as T;
};
