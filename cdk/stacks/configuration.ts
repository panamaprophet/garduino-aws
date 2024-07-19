import { join } from 'path';
import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Cors, HttpIntegration } from 'aws-cdk-lib/aws-apigateway';
import { CorsHttpMethod, HttpApi, HttpMethod, IIntegration } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction, NodejsFunctionProps, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';

export class CdkStack extends Stack {
  api: HttpApi;

  get: NodejsFunction;
  list: NodejsFunction;
  create: NodejsFunction;
  remove: NodejsFunction;
  update: NodejsFunction;

  configurationTable: Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const context = this.node.getContext('props');

    const userPoolId = context['userPoolId'];
    const userPoolClientId = context['userPoolClientId'];
    const issuerUrl = `https://cognito-idp.${this.region}.amazonaws.com/${userPoolId}`;

    this.configurationTable = new Table(this, 'configurationTable', {
      tableName: `${this.stackName}-table`,
      partitionKey: { name: 'controllerId', type: AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
    });

    this.configurationTable.addGlobalSecondaryIndex({
      indexName: 'ownerId_Index',
      partitionKey: { name: 'ownerId', type: AttributeType.STRING },
      sortKey: { name: 'controllerId', type: AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
    });

    const iotPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'iot:AttachPolicy',
        'iot:AttachThingPrincipal',
        'iot:CreateKeysAndCertificate',
        'iot:CreatePolicy',
        'iot:CreateThing',
      ],
      resources: ['*'],
    });

    const commonLambdaProps: Partial<NodejsFunctionProps> = {
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      bundling: {
        minify: true,
      },
      environment: {
        CONFIGURATION_TABLE: this.configurationTable.tableName,
      },
    };

    this.get = new NodejsFunction(this, 'getConfiguration', {
      ...commonLambdaProps,
      handler: 'index.getConfiguration',
      entry: join(__dirname, '../../src/services/configuration/index.ts'),
    });

    this.list = new NodejsFunction(this, 'listConfigurations', {
      ...commonLambdaProps,
      handler: 'index.listConfigurations',
      entry: join(__dirname, '../../src/services/configuration/index.ts'),
    });

    this.create = new NodejsFunction(this, 'createConfiguration', {
      ...commonLambdaProps,
      initialPolicy: [iotPolicy],
      handler: 'index.createConfiguration',
      entry: join(__dirname, '../../src/services/configuration/index.ts'),
    });

    this.remove = new NodejsFunction(this, 'removeRonfiguration', {
      ...commonLambdaProps,
      initialPolicy: [iotPolicy],
      handler: 'index.removeConfiguration',
      entry: join(__dirname, '../../src/services/configuration/index.ts'),
    });

    this.update = new NodejsFunction(this, 'updateConfiguration', {
      ...commonLambdaProps,
      handler: 'index.updateConfiguration',
      entry: join(__dirname, '../../src/services/configuration/index.ts'),
    });

    this.configurationTable.grantReadWriteData(this.get);
    this.configurationTable.grantReadWriteData(this.list);
    this.configurationTable.grantReadWriteData(this.create);
    this.configurationTable.grantReadWriteData(this.update);
    this.configurationTable.grantReadWriteData(this.remove);

    const authorizer = new HttpJwtAuthorizer('authorizer', issuerUrl, { jwtAudience: [userPoolClientId] });

    this.api = new HttpApi(this, `httpApi`, {
      apiName: `${this.stackName}-api`,
      corsPreflight: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowMethods: [CorsHttpMethod.ANY],
        maxAge: Duration.seconds(500),
      },
      defaultAuthorizer: authorizer,
    });

    this.api.addRoutes({
      path: '/configuration',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(`${this.stackName}-api-list-configurations`, this.list),
    });

    this.api.addRoutes({
      path: '/configuration',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(`${this.stackName}-api-create-configuration`, this.create),
    });

    this.api.addRoutes({
      path: '/configuration/{controllerId}',
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration(`${this.stackName}-api-update-configuration`, this.update),
    });

    this.api.addRoutes({
      path: '/configuration/{controllerId}',
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration(`${this.stackName}-api-remove-configuration`, this.remove),
    });

    this.api.addRoutes({
      path: '/configuration/{controllerId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(`${this.stackName}-api-get-configuration`, this.get),
    });

    new CfnOutput(this, 'endpoint', { value: String(this.api.url) });
  }
}
