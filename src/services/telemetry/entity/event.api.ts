import { table } from '@/shared/db';
import { env } from '@/shared/env';
import { ControllerEvent, toEventId } from './event.model';
import { Range } from './range.schema';

const RANGE_CONDITION = '#controllerId = :controllerId AND #id BETWEEN :from AND :to';

export interface EventQuery extends Range {
    order: 'asc' | 'desc';
    limit: number;
    types: string[];
    lastKey?: string;
}

const eventsTableName = env('EVENTS_TABLE');
const latestTableName = env('LATEST_TABLE');

const eventsTable = table<ControllerEvent>(eventsTableName);
const latestTable = table<ControllerEvent>(latestTableName);

const toRangeValues = (controllerId: string, { from, to }: Range) => ({
    ':controllerId': controllerId,
    ':from': toEventId(from, ''),
    ':to': toEventId(to, '~'),
});

const toTypeFilter = (types: string[]) => {
    if (types.length === 0) {
        return { filter: undefined, values: {} };
    }

    const values = Object.fromEntries(types.map((type, index) => [`:type${index}`, type]));
    const filter = `#type IN (${Object.keys(values).join(', ')})`;

    return { filter, values };
};

export const saveEvent = async (event: ControllerEvent) => {
    await eventsTable.put(event);

    return event;
};

export const saveLatestEvent = (event: ControllerEvent) => {
    return latestTable.put(event, {
        condition: 'attribute_not_exists(#ts) OR #ts < :ts',
        values: { ':ts': event.ts },
    });
};

export const listLatestEvents = (controllerId: string) => {
    return latestTable.queryAll('#controllerId = :controllerId', { ':controllerId': controllerId });
};

export const listEvents = (controllerId: string, range: Range) => {
    const values = toRangeValues(controllerId, range);

    return eventsTable.queryAll(RANGE_CONDITION, values);
};

export const listEventsPage = async (controllerId: string, { order, limit, types, lastKey, ...range }: EventQuery) => {
    const typeFilter = toTypeFilter(types);
    const values = { ...toRangeValues(controllerId, range), ...typeFilter.values };
    const startKey = lastKey ? { controllerId, id: lastKey } : undefined;

    const page = await eventsTable.query(RANGE_CONDITION, values, { filter: typeFilter.filter, limit, order, startKey });

    const nextKey = page.lastKey ? String(page.lastKey.id) : undefined;

    return { items: page.items, lastKey: nextKey };
};
