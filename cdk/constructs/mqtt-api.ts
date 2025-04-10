import { Duration } from 'aws-cdk-lib';
import { PolicyStatement, Effect, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnTopicRule } from 'aws-cdk-lib/aws-iot';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunctionProps, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';

export class Mqtt extends Construct {
    eventTopic: CfnTopicRule;
    configurationTopic: CfnTopicRule;

    eventTopicHandler: NodejsFunction;
    configurationTopicHandler: NodejsFunction;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const iotPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['iot:Publish', 'iot:Connect'],
            resources: ['*'],
        });

        const commonLambdaProps: Partial<NodejsFunctionProps> = {
            initialPolicy: [iotPolicy],
            runtime: Runtime.NODEJS_20_X,
            architecture: Architecture.ARM_64,
            bundling: { minify: true },
            timeout: Duration.seconds(60),
            environment: {},
        };

        this.configurationTopicHandler = new NodejsFunction(this, 'configurationTopicHandler', {
            ...commonLambdaProps,
            handler: 'index.mqttConfigurationTopicHandler',
            entry: join(__dirname, '../src/services/mqtt/index.ts'),
        });

        this.configurationTopic = new CfnTopicRule(this, 'configurationTopicRule', {
            topicRulePayload: {
                sql: `SELECT topic(2) as controllerId FROM 'controllers/+/config/pub'`,
                actions: [{ lambda: { functionArn: this.configurationTopicHandler.functionArn } }],
            },
        });

        this.eventTopicHandler = new NodejsFunction(this, 'eventTopicHandler', {
            ...commonLambdaProps,
            handler: 'index.mqttEventTopicHandler',
            entry: join(__dirname, '../src/services/mqtt/index.ts'),
        });

        this.eventTopic = new CfnTopicRule(this, 'eventTopicRule', {
            topicRulePayload: {
                sql: `SELECT *, topic(2) as controllerId FROM 'controllers/+/events/pub'`,
                actions: [{ lambda: { functionArn: this.eventTopicHandler.functionArn } }],
            },
        });

        this.configurationTopicHandler.grantInvoke(new ServicePrincipal('iot.amazonaws.com'));

        this.eventTopicHandler.grantInvoke(new ServicePrincipal('iot.amazonaws.com'));
    }
}
