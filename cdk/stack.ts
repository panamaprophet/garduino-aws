import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';

import { Controllers } from '@/services/controllers/controllers.construct';
import { Firmware } from '@/services/firmware/firmware.construct';
import { Settings } from '@/services/settings/settings.construct';
import { Telemetry } from '@/services/telemetry/telemetry.construct';
import { Api } from './constructs/http-api';
import { Mqtt } from './constructs/mqtt-api';

export class Garduino extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const api = new Api(this, 'http-api');
        const mqtt = new Mqtt(this, 'mqtt-api');

        new Controllers(this, 'controllers', { api, mqtt });
        new Settings(this, 'settings', { api, mqtt });
        new Telemetry(this, 'telemetry', { api, mqtt });
        new Firmware(this, 'firmware', { api, mqtt });
    }
}
