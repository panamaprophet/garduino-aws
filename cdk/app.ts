#!/usr/bin/env ts-node

import 'source-map-support/register';
import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';

import { Construct } from 'constructs';
import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';

import { Configuration } from './constructs/configuration';
import { DataCollector } from './constructs/data-collector';
import { Api } from './constructs/http-api';
import { Mqtt } from './constructs/mqtt-api';

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

class Garduino extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const configuration = new Configuration(this, 'configuration');
        const dataCollector = new DataCollector(this, 'data-collector');

        const api = new Api(this, 'http-api');
        const mqtt = new Mqtt(this, 'mqtt-api');

        api.addRoute('/v1/controllers', configuration.list, { method: HttpMethod.GET });
        api.addRoute('/v1/controllers', configuration.create, { method: HttpMethod.POST });

        api.addRoute('/v1/controllers/{controllerId}', configuration.update, { method: HttpMethod.PUT });
        api.addRoute('/v1/controllers/{controllerId}', configuration.remove, { method: HttpMethod.DELETE });
        api.addRoute('/v1/controllers/{controllerId}', configuration.get, { method: HttpMethod.GET });

        api.addRoute('/v1/controllers/{controllerId}/data', dataCollector.push, { method: HttpMethod.PUT });
        api.addRoute('/v1/controllers/{controllerId}/data', dataCollector.query, { method: HttpMethod.GET });
    }
}

const app = new App();

const stack = new Garduino(app, 'garduino', props);
