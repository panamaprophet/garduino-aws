import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';

import { Controllers } from './constructs/controllers';
import { Firmware } from './constructs/firmware';
import { Api } from './constructs/http-api';
import { Mqtt } from './constructs/mqtt-api';
import { Settings } from './constructs/settings';
import { Telemetry } from './constructs/telemetry';

export class Garduino extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const controllers = new Controllers(this, 'controllers');
        const settings = new Settings(this, 'settings');
        const telemetry = new Telemetry(this, 'telemetry');
        const firmware = new Firmware(this, 'firmware');

        const api = new Api(this, 'http-api');
        const mqtt = new Mqtt(this, 'mqtt-api');

        api.addRoute('/v2/controllers', controllers.list);
        api.addRoute('/v2/controllers', controllers.create, { method: HttpMethod.POST });
        api.addRoute('/v2/controllers/{controllerId}', controllers.get);
        api.addRoute('/v2/controllers/{controllerId}', controllers.remove, { method: HttpMethod.DELETE });

        api.addRoute('/v2/controllers/{controllerId}/settings', settings.get);
        api.addRoute('/v2/controllers/{controllerId}/settings', settings.update, { method: HttpMethod.PATCH });

        api.addRoute('/v2/controllers/{controllerId}/events', telemetry.listEvents);

        api.addRoute('/v2/firmware', firmware.list);

        mqtt.addTopicRule({
            topic: 'controllers/+/events',
            handler: telemetry.ingestEvent,
            select: 'topic(2) AS controllerId, timestamp() AS receivedAt, * AS payload',
        });

        mqtt.addTopicRule({
            topic: 'controllers/+/settings/get',
            handler: settings.request,
            select: 'topic(2) AS controllerId',
        });
    }
}
