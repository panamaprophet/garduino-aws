import { defineHandler, getPathParameter } from '@/lib/http';
import { mapConfiguration, requireController } from '../../lib';

const isTruthyFlag = (value: string | undefined) => value === 'true' || value === '1';

export const handler = defineHandler(async (event, { userId }) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const isRaw = isTruthyFlag(event.queryStringParameters?.raw);

    const configuration = await requireController(controllerId, userId);

    return isRaw ? configuration : mapConfiguration(configuration);
});
