import { Construct } from 'constructs';
import { CfnTopicRule } from 'aws-cdk-lib/aws-iot';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { createLogGroup } from '../lib/log-group';

interface TopicRuleProps {
    id: string;
    topic: string;
    handler: IFunction;
    select?: string;
    where?: string;
}

export class Mqtt extends Construct {
    private readonly errorLogGroup: ILogGroup;
    private readonly errorRole: Role;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.errorLogGroup = createLogGroup(this, 'topic-rule-errors');
        this.errorRole = new Role(this, 'topic-rule-errors-role', {
            assumedBy: new ServicePrincipal('iot.amazonaws.com'),
        });

        this.errorLogGroup.grantWrite(this.errorRole);
    }

    addTopicRule({ id, topic, handler, select = '*', where }: TopicRuleProps) {
        const sql = [`SELECT ${select} FROM '${topic}'`, where && `WHERE ${where}`].filter(Boolean).join(' ');

        new CfnTopicRule(this, `${id}-rule`, {
            topicRulePayload: {
                sql,
                actions: [{ lambda: { functionArn: handler.functionArn } }],
                errorAction: {
                    cloudwatchLogs: {
                        logGroupName: this.errorLogGroup.logGroupName,
                        roleArn: this.errorRole.roleArn,
                    },
                },
                awsIotSqlVersion: '2016-03-23',
            },
        });

        handler.grantInvoke(new ServicePrincipal('iot.amazonaws.com'));
    }
}
