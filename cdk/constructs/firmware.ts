import { Construct } from 'constructs';
import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import { PolicyStatement, StarPrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { createFunction } from '../lib/function';
import { ServiceProps } from '../lib/service';
import { routes } from '@/services/firmware/firmware.config';

export class Firmware extends Construct {
    constructor(scope: Construct, id: string, { api }: ServiceProps) {
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

        const listFirmware = createFunction(this, {
            service: 'firmware',
            feature: 'list-firmware',
            environment: { FIRMWARE_BUCKET: bucket.bucketName },
        });

        bucket.grantRead(listFirmware);

        api.addRoute(routes.listFirmware, listFirmware);
    }
}
