import { join } from 'path';
import { Construct } from 'constructs';
import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import { PolicyStatement, StarPrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunctionProps, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class Firmware extends Construct {
    readonly bucket: Bucket;

    list: NodejsFunction;
    getDownloadUrl: NodejsFunction;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const { stackName } = Stack.of(this);

        this.bucket = new Bucket(this, 'bucket', {
            bucketName: `${stackName}-firmware`,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            blockPublicAccess: new BlockPublicAccess({
                blockPublicAcls: true,
                blockPublicPolicy: false,
                ignorePublicAcls: true,
                restrictPublicBuckets: false,
            }),
        });

        this.bucket.addToResourcePolicy(
            new PolicyStatement({
                sid: 'PublicReadGetObject',
                actions: ['s3:GetObject'],
                resources: [this.bucket.arnForObjects('*')],
                principals: [new StarPrincipal()],
            }),
        );

        const commonLambdaProps: Partial<NodejsFunctionProps> = {
            runtime: Runtime.NODEJS_LATEST,
            architecture: Architecture.ARM_64,
            bundling: { minify: true },
            environment: { FIRMWARE_BUCKET: this.bucket.bucketName },
        };

        this.list = new NodejsFunction(this, 'listFirmware', {
            ...commonLambdaProps,
            functionName: `${stackName}-list-firmware`,
            handler: 'index.list',
            entry: join(__dirname, '../../src/services/firmware/index.ts'),
        });

        this.bucket.grantRead(this.list);

        this.getDownloadUrl = new NodejsFunction(this, 'getFirmwareDownloadUrl', {
            ...commonLambdaProps,
            functionName: `${stackName}-get-firmware-download-url`,
            handler: 'index.getFirmwareDownloadUrl',
            entry: join(__dirname, '../../src/services/firmware/index.ts'),
        });

        this.bucket.grantRead(this.getDownloadUrl);
    }
}
