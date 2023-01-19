import { PublishCommand } from "@aws-sdk/client-iot-data-plane"
import { client } from "../../providers/iot-data-plane"

export const publish = (topic: string, payload: { [k: string]: any }) => {
    return client.send(new PublishCommand({
        topic,
        payload: Buffer.from(JSON.stringify(payload)),
    }));
};
