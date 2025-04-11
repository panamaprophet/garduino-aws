#!/usr/bin/env ts-node

import 'source-map-support/register';

import { App, StackProps } from 'aws-cdk-lib';
import { Garduino } from './stack';

if (!process.env.GIT_COMMIT_HASH) {
    throw Error('Invalid Git Commit Hash');
}

const props: StackProps = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    stackName: `garduino-${process.env.GIT_COMMIT_HASH}`,
};

const app = new App();

new Garduino(app, 'garduino', props);
