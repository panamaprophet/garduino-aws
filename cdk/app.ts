#!/usr/bin/env tsx

import { App } from 'aws-cdk-lib';
import { env } from '@/shared/env';
import { Garduino } from './stack';

const apiVersion = env('API_VERSION');

const app = new App();

new Garduino(app, 'garduino', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    stackName: `garduino-${apiVersion}`,
});
