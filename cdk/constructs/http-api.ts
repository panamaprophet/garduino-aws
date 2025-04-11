import { Construct } from 'constructs';
import { Duration, Stack } from 'aws-cdk-lib';
import { Cors } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpApi, CorsHttpMethod, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';

export class Api extends Construct {
    api: HttpApi;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const { stackName, region } = Stack.of(this);

        const context = this.node.getContext('props');

        const userPoolId = context['userPoolId'];
        const userPoolClientIds = context['userPoolClientIds'];
        const issuerUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

        const authorizer = new HttpJwtAuthorizer('authorizer', issuerUrl, { jwtAudience: [...userPoolClientIds] });

        this.api = new HttpApi(this, `httpApi`, {
            apiName: `${stackName}-api`,
            corsPreflight: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowHeaders: Cors.DEFAULT_HEADERS,
                allowMethods: [CorsHttpMethod.ANY],
                maxAge: Duration.seconds(500),
            },
            defaultAuthorizer: authorizer,
        });
    }

    addRoute(path: string, handler: IFunction, options: { method: HttpMethod } = { method: HttpMethod.GET }) {
        const { stackName } = Stack.of(this);
        const name = path.replace(/\W/g, '');

        this.api.addRoutes({
            path,
            methods: [options.method],
            integration: new HttpLambdaIntegration(`${stackName}-api-${name}`, handler),
        });
    }
}
