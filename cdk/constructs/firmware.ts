import { Construct } from 'constructs';
import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import { PolicyStatement, StarPrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { createFunction } from '../lib/function';

export class Firmware extends Construct {
    readonly list: NodejsFunction;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const { stackName } = Stack.of(this);

        const bucket = new Bucket(this, 'bucket', {
            bucketName: `${stackName}-firmware`,
            removalPolicy: RemovalPolicy.RETAIN,
            blockPublicAccess: new BlockPublicAccess({
                blockPublicAcls: true,
                blockPublicPolicy: false,
                ignorePublicAcls: true,
                restrictPublicBuckets: false,
            }),
        });

        bucket.addToResourcePolicy(
            new PolicyStatement({
                sid: 'PublicReadGetObject',
                actions: ['s3:GetObject'],
                resources: [bucket.arnForObjects('*')],
                principals: [new StarPrincipal()],
            }),
        );

        this.list = createFunction(this, {
            service: 'firmware',
            handler: 'listFirmware',
            environment: { FIRMWARE_BUCKET: bucket.bucketName },
        });

        bucket.grantRead(this.list);
    }
}
