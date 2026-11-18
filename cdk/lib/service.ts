import { Api } from '../constructs/http-api';
import { Mqtt } from '../constructs/mqtt-api';

export interface ServiceProps {
    api: Api;
    mqtt: Mqtt;
}
