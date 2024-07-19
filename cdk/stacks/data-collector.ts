import { join } from 'path';
import { Construct } from 'constructs';
import { Cors } from 'aws-cdk-lib/aws-apigateway';
import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const context = this.node.getContext('props');

    const userPoolId = context['userPoolId'];
    const userPoolClientId = context['userPoolClientId'];
    const issuerUrl = `https://cognito-idp.${this.region}.amazonaws.com/${userPoolId}`;

    const table = new Table(this, 'data-table', {
      tableName: `${this.stackName}-table`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      sortKey: { name: 'ts', type: AttributeType.NUMBER },
      readCapacity: 1,
      writeCapacity: 1,
    });

    table.addGlobalSecondaryIndex({
      indexName: 'controllerId_Index',
      partitionKey: { name: 'controllerId', type: AttributeType.STRING },
      sortKey: { name: 'ts', type: AttributeType.NUMBER },
      readCapacity: 1,
      writeCapacity: 1,
    });

    const commonLambdaProps: Partial<NodejsFunctionProps> = {
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      bundling: {
        minify: true,
      },
      environment: {
        DATA_TABLE: table.tableName,
      },
    };

    const storeHandler = new NodejsFunction(this, 'storehandler', {
      ...commonLambdaProps,
      handler: 'index.store',
      entry: join(__dirname, '../../src/services/data-collector/index.ts'),
    });

    const queryHandler = new NodejsFunction(this, 'queryhandler', {
      ...commonLambdaProps,
      handler: 'index.query',
      entry: join(__dirname, '../../src/services/data-collector/index.ts'),
    });

    table.grantReadWriteData(storeHandler);
    table.grantReadWriteData(queryHandler);

    const authorizer = new HttpJwtAuthorizer('authorizer', issuerUrl, { jwtAudience: [userPoolClientId] });

    const api = new HttpApi(this, 'api', {
      apiName: `${this.stackName}-api`,
      corsPreflight: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowMethods: [CorsHttpMethod.ANY],
        maxAge: Duration.seconds(500),
      },
      defaultAuthorizer: authorizer,
    });

    api.addRoutes({
      path: '/data/{controllerId}',
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration(`${this.stackName}-api-store-handler`, storeHandler),
    });

    api.addRoutes({
      path: '/data/{controllerId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(`${this.stackName}-api-query-handler`, queryHandler),
    });

    new CfnOutput(this, 'endpoint', { value: String(api.url) });
  }
}
