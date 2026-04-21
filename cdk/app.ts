#!/usr/bin/env tsx

import { App, StackProps } from 'aws-cdk-lib';
import { Garduino } from './stack';

const apiVersion = process.env.API_VERSION;

if (!apiVersion) {
  throw new Error('API_VERSION environment variable is not set');
}

const props: StackProps = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    stackName: `garduino-${apiVersion}`,
};

const app = new App();

new Garduino(app, 'garduino', props);
