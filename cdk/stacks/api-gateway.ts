import { aws_apigatewayv2, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { AddRoutesOptions, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class CdkStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const cognitoPoolId = Fn.importValue('auth:userPoolId');
        const issuerUrl = `https://cognito-idp.${this.region}.amazonaws.com/${cognitoPoolId}`;

        const authorizer = new HttpJwtAuthorizer('authorizer', issuerUrl, {
            jwtAudience: [],
        });

        const apiGateway = new HttpApi(this, 'api-gateway', {
            defaultAuthorizer: authorizer,
        });

        apiGateway.addRoutes({
            path: '/configuration',
            methods: [HttpMethod.GET],
            integration: new HttpLambdaIntegration(
                'list-configurations',
                Function.fromFunctionArn(this, 'list-configurations', Fn.importValue('configuration:list'))
            ),
        });

        apiGateway.addRoutes({
            path: '/configuration',
            methods: [HttpMethod.],
            integration: new HttpLambdaIntegration(
                'get-configuration',
                Function.fromFunctionArn(this, 'get-configuration', Fn.importValue('configuration:get'))
            ),
        });

        // The code that defines your stack goes here

        // example resource
        // const queue = new sqs.Queue(this, 'CdkQueue', {
        //   visibilityTimeout: cdk.Duration.seconds(300)
        // });
    }
}
