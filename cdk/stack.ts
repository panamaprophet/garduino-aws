import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { Auth } from './constructs/auth';
import { Controllers } from './constructs/controllers';
import { Firmware } from './constructs/firmware';
import { Api } from './constructs/http-api';
import { Mqtt } from './constructs/mqtt-api';
import { Settings } from './constructs/settings';
import { Telemetry } from './constructs/telemetry';

export class Garduino extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const firmwareBucketName = `${this.stackName}-firmware`;
        const firmwareBaseUrl = `https://${firmwareBucketName}.s3.${this.region}.amazonaws.com`;

        const auth = new Auth(this, 'auth');
        const api = new Api(this, 'http-api');
        const mqtt = new Mqtt(this, 'mqtt-api');

        new Controllers(this, 'controllers', { api, mqtt, auth, firmwareBaseUrl });
        new Settings(this, 'settings', { api, mqtt });
        new Telemetry(this, 'telemetry', { api, mqtt });
        new Firmware(this, 'firmware', { api, mqtt, bucketName: firmwareBucketName });

        new CfnOutput(this, 'ApiUrl', { value: api.url });
        new CfnOutput(this, 'UserPoolId', { value: auth.userPoolId });
        new CfnOutput(this, 'WebClientId', { value: auth.webClientId });
        new CfnOutput(this, 'McpClientId', { value: auth.mcpClientId });
        new CfnOutput(this, 'AuthDomain', { value: auth.domainUrl });
        new CfnOutput(this, 'FirmwareBucket', { value: firmwareBucketName });
    }
}
