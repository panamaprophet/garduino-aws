#!/usr/bin/env ts-node

import 'source-map-support/register';
import { App, StackProps } from 'aws-cdk-lib';

import { CdkStack as ConfigurationStack } from './stacks/configuration';
import { CdkStack as DataCollectorStack } from './stacks/data-collector';
import { CdkStack as MqttProxyStack } from './stacks/mqtt-proxy';
import { CdkStack as HttpProxyStack } from './stacks/http-proxy';

const app = new App();

const props: StackProps = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
};

new ConfigurationStack(app, 'garduino-configuration', props);
new DataCollectorStack(app, 'garduino-data-collector', props);
new MqttProxyStack(app, 'garduino-mqtt-proxy', props);
new HttpProxyStack(app, 'garduino-http-proxy', props);
