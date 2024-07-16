import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';

export const client = new IoTDataPlaneClient({});

export const publish = (topic: string, payload: { [k: string]: any }) => {
    return client.send(new PublishCommand({
        topic,
        payload: Buffer.from(JSON.stringify(payload)),
    }));
};
