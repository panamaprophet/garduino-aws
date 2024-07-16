import * as cdk from 'aws-cdk-lib';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends cdk.Stack {
    userPool: UserPool;
    userPoolClient: UserPoolClient;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.userPool = new UserPool(this, 'user-pool', {

        });

        this.userPoolClient = new UserPoolClient(this, 'user-pool-client', {
            userPool: this.userPool,
        });

        new cdk.CfnOutput(this, 'user-pool-id', {
            value: this.userPool.userPoolId,
            exportName: 'auth:user-pool-id',
        });

        new cdk.CfnOutput(this, 'user-pool-client-id', {
            value: this.userPoolClient.userPoolClientId,
            exportName: 'auth:user-pool-client-id',
        });
    }
}
