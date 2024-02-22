import { publish } from "../../../../../shared/resolvers/mqtt";

export const handler = async (message: { controllerId: string }) => {
    const { controllerId } = message;

    const requestUrl = `${process.env.CONTROLLER_CONFIGURATION_URL}/configuration/${controllerId}`;
    const responseTopic = `controllers/${controllerId}/config/sub`;

    const configuration = await fetch(requestUrl).then(response => response.json());

    if (!configuration) {
        console.log({ error: 'no configuration found '});
        return;
    }

    await publish(responseTopic, configuration);

    console.log({ success: true });
};
