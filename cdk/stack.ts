import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Api } from './constructs/http-api';
import { Mqtt } from './constructs/mqtt-api';
import { Auth } from './constructs/auth';
import { Controllers } from './constructs/controllers';
import { Settings } from './constructs/settings';
import { Telemetry } from './constructs/telemetry';
import { Firmware } from './constructs/firmware';

interface GarduinoProps extends StackProps {
    authDomainPrefix: string;
}

export class Garduino extends Stack {
    constructor(scope: Construct, id: string, { authDomainPrefix, ...props }: GarduinoProps) {
        super(scope, id, props);

        const firmwareBucketName = `${this.stackName}-firmware`;
        const firmwareBaseUrl = `https://${firmwareBucketName}.s3.${this.region}.amazonaws.com`;

        const auth = new Auth(this, 'auth', { domainPrefix: authDomainPrefix });
        const api = new Api(this, 'http-api');
        const mqtt = new Mqtt(this, 'mqtt-api');

        new Controllers(this, 'controllers', { api, mqtt, auth, firmwareBaseUrl });
        new Settings(this, 'settings', { api, mqtt });
        new Telemetry(this, 'telemetry', { api, mqtt });
        new Firmware(this, 'firmware', { api, mqtt, bucketName: firmwareBucketName });
    }
}
