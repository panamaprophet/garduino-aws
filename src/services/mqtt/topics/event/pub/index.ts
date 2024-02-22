export const handler = async (message: { controllerId: string, [k: string]: unknown }) => {
    const { controllerId, ...payload } = message;

    const requestUrl = `${process.env.DATA_COLLECTOR_URL}/data/${controllerId}`;

    const result = await fetch(requestUrl, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });

    console.log({ success: result });
};
