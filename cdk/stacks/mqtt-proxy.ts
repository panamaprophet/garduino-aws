import { CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnTopicRule } from 'aws-cdk-lib/aws-iot';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AwsCustomResource, PhysicalResourceId, AwsCustomResourcePolicy } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { join } from 'path';

export class CdkStack extends Stack {
  configurationTopicHandler: NodejsFunction;
  configurationTopicRule: CfnTopicRule;
  eventTopicHandler: NodejsFunction;
  eventTopicRule: CfnTopicRule;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const iotPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['iot:Publish', 'iot:Connect'],
      resources: ['*'],
    });

    const configurationApiEndpoint = Fn.importValue('garduino-configuration:endpoint');
    const dataCollectorApiEndpoint = Fn.importValue('garduino-data-collector:endpoint');

    const commonLambdaProps: Partial<NodejsFunctionProps> = {
      initialPolicy: [iotPolicy],
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      bundling: { minify: true },
      environment: {
        CONTROLLER_CONFIGURATION_URL: configurationApiEndpoint,
        DATA_COLLECTOR_URL: dataCollectorApiEndpoint,
      },
    };

    this.configurationTopicHandler = new NodejsFunction(this, 'configurationTopicHandler', {
      ...commonLambdaProps,
      handler: 'index.mqttConfigurationTopicHandler',
      entry: join(__dirname, '../../src/services/mqtt/index.ts'),
    });

    this.eventTopicHandler = new NodejsFunction(this, 'eventTopicHandler', {
      ...commonLambdaProps,
      handler: 'index.mqttConfigurationTopicHandler',
      entry: join(__dirname, '../../src/services/mqtt/index.ts'),
    });

    this.configurationTopicRule = new CfnTopicRule(this, 'configurationTopicRule', {
      topicRulePayload: {
        sql: `SELECT topic(2) as controllerId FROM 'controllers/+/config/pub'`,
        actions: [{ lambda: { functionArn: this.configurationTopicHandler.functionArn } }],
      },
    });

    this.eventTopicRule = new CfnTopicRule(this, 'eventTopicRule', {
      topicRulePayload: {
        sql: `SELECT *, topic(2) as controllerId FROM 'controllers/+/events/pub'`,
        actions: [{ lambda: { functionArn: this.eventTopicHandler.functionArn } }],
      },
    });

    this.configurationTopicHandler.grantInvoke(new ServicePrincipal('iot.amazonaws.com'));

    this.eventTopicHandler.grantInvoke(new ServicePrincipal('iot.amazonaws.com'));

    const iotDataEndpoint = new AwsCustomResource(this, 'iotDataEndpoint', {
      onCreate: {
        service: 'Iot',
        action: 'describeEndpoint',
        physicalResourceId: PhysicalResourceId.fromResponse('endpointAddress'),
        parameters: { 'endpointType': 'iot:Data-ATS' },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
    });

    new CfnOutput(this, 'endpoint', {
      value: String(iotDataEndpoint.getResponseField('endpointAddress')),
      exportName: `${this.stackName}:endpoint`,
    });
  }
}
