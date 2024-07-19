#!/usr/bin/env ts-node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { CdkStack as ConfigurationStack } from './stacks/configuration';
// import { CdkStack as DataCollectorStack } from './stacks/data-collector';
// import { CdkStack as MqttProxyStack } from './stacks/mqtt.stack';

const app = new cdk.App();

const props: cdk.StackProps = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
};

new ConfigurationStack(app, 'garduino-configuration', props);
// new DataCollectorStack(app, 'data-collector', props);
// new MqttProxyStack(app, 'mqtt-messaging', props);
