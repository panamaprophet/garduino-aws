import { Construct } from 'constructs';
import { CfnOutput, Duration, Stack } from 'aws-cdk-lib';
import { Cors } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpApi, CorsHttpMethod, HttpMethod, CfnStage } from 'aws-cdk-lib/aws-apigatewayv2';

export class Api extends Construct {
    api: HttpApi;

    private authorizer?: HttpLambdaAuthorizer;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const { stackName } = Stack.of(this);

        this.api = new HttpApi(this, `httpApi`, {
            apiName: `${stackName}-api`,
            corsPreflight: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowHeaders: Cors.DEFAULT_HEADERS,
                allowMethods: [CorsHttpMethod.ANY],
                maxAge: Duration.seconds(500),
            },
        });

        const defaultStage = this.api.defaultStage?.node.defaultChild as CfnStage | undefined;

        defaultStage?.addPropertyOverride('DefaultRouteSettings', {
            ThrottlingRateLimit: 5,
            ThrottlingBurstLimit: 10,
        });

        new CfnOutput(this, 'ApiUrl', { value: this.api.apiEndpoint });
    }

    useAuthorizer(handler: IFunction) {
        this.authorizer = new HttpLambdaAuthorizer('authorizer', handler, {
            responseTypes: [HttpLambdaResponseType.SIMPLE],
            identitySource: ['$request.header.Authorization'],
            resultsCacheTtl: Duration.seconds(0),
        });
    }

    addRoute(routeKey: string, handler: IFunction) {
        const { stackName } = Stack.of(this);
        const [method, path] = routeKey.split(' ');

        if (!path || !Object.values<string>(HttpMethod).includes(method!)) {
            throw new Error(`Invalid route key "${routeKey}", expected "<METHOD> <path>"`);
        }

        if (!this.authorizer) {
            throw new Error(`Route "${routeKey}" is registered before the API authorizer`);
        }

        this.api.addRoutes({
            path,
            methods: [method as HttpMethod],
            integration: new HttpLambdaIntegration(`${stackName}-api-${routeKey.replace(/\W/g, '')}`, handler),
            authorizer: this.authorizer,
        });
    }
}
