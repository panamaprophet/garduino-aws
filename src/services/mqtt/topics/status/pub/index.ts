import { publish } from '../../../../../shared/resolvers/mqtt';

export const handler = async (message: { controllerId: string, [k: string]: unknown }) => {
    const { controllerId, ...payload } = message;

    const topic = `controllers/${controllerId}/status/sub`;

    await publish(topic, payload);
};
