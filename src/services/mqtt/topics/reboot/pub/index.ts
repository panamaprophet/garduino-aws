import { publish } from '../../../../../shared/resolvers/mqtt';

export const handler = async (message: { controllerId: string, [k: string]: unknown }) => {
    const { controllerId, ...payload } = message;

    const topic = `controllers/${controllerId}/reboot/sub`;

    await publish(topic, payload);
};
