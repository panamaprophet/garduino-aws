import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { HttpMethod } from 'aws-cdk-lib/aws-events';

import { Configuration } from './constructs/configuration';
import { DataCollector } from './constructs/data-collector';
import { Api } from './constructs/http-api';
import { Mqtt } from './constructs/mqtt-api';

export class Garduino extends Stack {
    mqtt: Mqtt;
    api: Api;

    configuration: Configuration;
    dataCollector: DataCollector;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.configuration = new Configuration(this, 'configuration');
        this.dataCollector = new DataCollector(this, 'data-collector');

        this.api = new Api(this, 'http-api');

        this.mqtt = new Mqtt(this, 'mqtt-api', {
            configurationTable: this.configuration.table.tableName,
            dataTable: this.dataCollector.table.tableName,
        });

        this.api.addRoute('/v1/controllers', this.configuration.list);
        this.api.addRoute('/v1/controllers', this.configuration.create, { method: HttpMethod.POST });

        this.api.addRoute('/v1/controllers/{controllerId}', this.configuration.update, { method: HttpMethod.PUT });
        this.api.addRoute('/v1/controllers/{controllerId}', this.configuration.remove, { method: HttpMethod.DELETE });
        this.api.addRoute('/v1/controllers/{controllerId}', this.configuration.get);

        this.api.addRoute('/v1/controllers/{controllerId}/data', this.dataCollector.push, { method: HttpMethod.PUT });
        this.api.addRoute('/v1/controllers/{controllerId}/data', this.dataCollector.query);
    }
}
