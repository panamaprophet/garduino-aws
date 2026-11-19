export const toCursor = (value: unknown) => {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
};

export const fromCursor = (cursor: string): unknown => {
    try {
        return JSON.parse(Buffer.from(cursor, 'base64url').toString());
    } catch {
        return null;
    }
};
