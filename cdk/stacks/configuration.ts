import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class CdkStack extends cdk.Stack {
  createConfiguration: NodejsFunction;
  removeConfiguration: NodejsFunction;
  updateConfiguration: NodejsFunction;
  getConfigurationLambda: NodejsFunction;
  listConfigurationsLambda: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.getConfigurationLambda = new NodejsFunction(this, 'get-configuration', {

    });

    this.listConfigurationsLambda = new NodejsFunction(this, 'list-configurations', {

    });

    this.createConfiguration = new NodejsFunction(this, 'create-configuration', {

    });

    this.removeConfiguration = new NodejsFunction(this, 'remove-configuration', {

    });

    this.updateConfiguration = new NodejsFunction(this, 'update-configuration', {

    });

    new cdk.CfnOutput(this, 'output-get-configuration-arn', {
      value: this.getConfigurationLambda.functionArn,
      exportName: 'configuration:get-configuration:arn',
    });

    new cdk.CfnOutput(this, 'output-list-configurations-arn', {
      value: this.listConfigurationsLambda.functionArn,
      exportName: 'configuration:list-configurations:arn',
    });

    new cdk.CfnOutput(this, 'output-create-configuration-arn', {
      value: this.createConfiguration.functionArn,
      exportName: 'configuration:create-configuration:arn',
    });

    new cdk.CfnOutput(this, 'output-remove-configuration-arn', {
      value: this.removeConfiguration.functionArn,
      exportName: 'configuration:remove-configuration:arn',
    });

    new cdk.CfnOutput(this, 'output-update-configuration-arn', {
      value: this.updateConfiguration.functionArn,
      exportName: 'configuration:update-configuration:arn',
    });
  }
}
