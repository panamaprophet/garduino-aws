import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

export const createLogGroup = (scope: Construct, id: string) => new LogGroup(scope, `${id}LogGroup`, {
    retention: RetentionDays.TWO_WEEKS,
    removalPolicy: RemovalPolicy.DESTROY,
});
