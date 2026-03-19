import { Construct } from 'constructs';
import { CfnTopicRule } from 'aws-cdk-lib/aws-iot';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
export class Mqtt extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);
    }

    addTopicRule(params: { topic: string; handler: IFunction; select?: string; }) {
        const { topic, handler, select = '*' } = params;

        const ruleId = topic.replace(/\W/g, '');

        new CfnTopicRule(this, ruleId, {
            topicRulePayload: {
                sql: `SELECT ${select} FROM '${topic}'`,
                actions: [{ lambda: { functionArn: handler.functionArn } }],
            },
        });

        handler.grantInvoke(new ServicePrincipal('iot.amazonaws.com'));
    }
}
