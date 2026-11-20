import { RemovalPolicy } from 'aws-cdk-lib';
import { PolicyStatement, StarPrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { routes } from '@/services/firmware/firmware.config';
import { createFunction, type ServiceProps } from '../lib';

interface FirmwareProps extends ServiceProps {
    bucketName: string;
}

export class Firmware extends Construct {
    constructor(scope: Construct, id: string, { api, bucketName }: FirmwareProps) {
        super(scope, id);

        const bucket = new Bucket(this, 'bucket', {
            bucketName,
            removalPolicy: RemovalPolicy.RETAIN,
            blockPublicAccess: new BlockPublicAccess({
                blockPublicAcls: true,
                blockPublicPolicy: false,
                ignorePublicAcls: true,
                restrictPublicBuckets: false,
            }),
        });

        const publicReadPolicy = new PolicyStatement({
            sid: 'PublicReadGetObject',
            actions: ['s3:GetObject'],
            resources: [bucket.arnForObjects('*')],
            principals: [new StarPrincipal()],
        });

        bucket.addToResourcePolicy(publicReadPolicy);

        const listFirmware = createFunction(this, {
            service: 'firmware',
            feature: 'list-firmware',
            environment: { FIRMWARE_BUCKET: bucket.bucketName },
        });

        bucket.grantRead(listFirmware);

        api.addRoute(routes.listFirmware, listFirmware);
    }
}
