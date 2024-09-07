import { CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Cors, HttpIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';

export class CdkStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const configurationApiEndpoint = Fn.importValue('garduino-configuration:endpoint');
        const dataCollectorApiEndpoint = Fn.importValue('garduino-data-collector:endpoint');

        const api = new RestApi(this, 'garduino-http-proxy', {
            restApiName: 'garduino-http-proxy',
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS,
                allowHeaders: Cors.DEFAULT_HEADERS,
            },
        });

        const v1 = api.root.addResource('v1');

        const configurations = v1.addResource('configurations');
        const data = v1.addResource('data');

        configurations
            .addMethod(HttpMethod.ANY, new HttpIntegration(configurationApiEndpoint, {
                httpMethod: HttpMethod.ANY,
                options: { passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH },
            }));

        configurations
            .addResource('{proxy+}')
            .addMethod(
                HttpMethod.ANY,
                new HttpIntegration(`${configurationApiEndpoint}{proxy}`, {
                    httpMethod: HttpMethod.ANY,
                    options: {
                        passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
                        requestParameters: {
                            'integration.request.path.proxy': 'method.request.path.proxy',
                        },
                    },
                }),
                {
                    requestParameters: {
                        'method.request.path.proxy': true,
                    },
                }
            );

        data
            .addMethod(HttpMethod.ANY, new HttpIntegration(dataCollectorApiEndpoint, {
                httpMethod: HttpMethod.ANY,
                options: { passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH },
            }));

        data
            .addResource('{proxy+}')
            .addMethod(
                HttpMethod.ANY,
                new HttpIntegration(`${dataCollectorApiEndpoint}{proxy}`, {
                    httpMethod: HttpMethod.ANY,
                    options: {
                        passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
                        requestParameters: {
                            'integration.request.path.proxy': 'method.request.path.proxy',
                        },
                    },
                }),
                {
                    requestParameters: {
                        'method.request.path.proxy': true,
                    },
                }
            );

        new CfnOutput(this, 'http-proxy-endpoint', {
            value: api.url,
            exportName: `${this.stackName}:endpoint`,
        });
    }
}
