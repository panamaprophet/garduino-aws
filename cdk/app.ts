#!/usr/bin/env ts-node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { CdkStack as ConfigurationStack } from './configuration.stack';
import { CdkStack as DataCollectorStack } from './data-collector.stack';
import { CdkStack as MqttStack } from './mqtt.stack';

const app = new cdk.App();

const props: cdk.StackProps = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
};

new ConfigurationStack(app, 'configuration', props);
new DataCollectorStack(app, 'data-collector', props);
new MqttStack(app, 'mqtt', props);
