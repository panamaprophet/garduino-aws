import { Construct } from 'constructs';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Table, TableProps } from 'aws-cdk-lib/aws-dynamodb';

type TableKeyProps = Pick<TableProps, 'partitionKey' | 'sortKey' | 'readCapacity' | 'writeCapacity'>;

export const createTable = (scope: Construct, name: string, props: TableKeyProps) => {
    const { stackName } = Stack.of(scope);

    return new Table(scope, `${name}-table`, {
        ...props,
        tableName: `${stackName}-${name}`,
        removalPolicy: RemovalPolicy.RETAIN,
        deletionProtection: true,
    });
};
