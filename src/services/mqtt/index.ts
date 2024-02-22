import { handler as mqttConfigurationTopicHandler } from './topics/configuration/pub';
import { handler as mqttEventTopicHandler } from './topics/events/pub';
import { handler as mqttRebootTopicHandler } from './topics/reboot/pub';
import { handler as mqttStatusTopicHandler } from './topics/status/pub';


type MessageType = 'config' | 'events' | 'reboot' | 'status';

type MessagePayload = { controllerId: string; messageType: MessageType; [k: string]: unknown };

type MessageHandler = (payload: MessagePayload) => Promise<void>;


const messageTypeToHandlerMap: { [k in MessageType]: MessageHandler } = {
    'events': mqttEventTopicHandler,
    'reboot': mqttRebootTopicHandler,
    'status': mqttStatusTopicHandler,
    'config': mqttConfigurationTopicHandler,
};


export const handler = async (payload: MessagePayload) => {
    const fn = messageTypeToHandlerMap[payload.messageType];

    if (!fn) {
        console.log('handler not found for event', payload.messageType);
        return;
    }

    return fn(payload);    
};
