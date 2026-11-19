import { table } from '@/shared/db';
import { ControllerEvent, toEventId } from './event.model';
import { Range } from './range.schema';

const MAX_PAGES = 5;

const RANGE_CONDITION = '#controllerId = :controllerId AND #id BETWEEN :from AND :to';

export interface EventQuery extends Range {
    order: 'asc' | 'desc';
    limit: number;
    types: string[];
    lastKey?: string;
}

const eventsTable = table<ControllerEvent>('EVENTS_TABLE');
const latestTable = table<ControllerEvent>('LATEST_TABLE');

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
    const items: ControllerEvent[] = [];

    let startKey: Record<string, unknown> | undefined = lastKey ? { controllerId, id: lastKey } : undefined;
    let pages = 0;

    do {
        const page = await eventsTable.query(RANGE_CONDITION, values, {
            filter: typeFilter.filter,
            limit: limit - items.length,
            order,
            startKey,
        });

        items.push(...page.items);
        startKey = page.lastKey;
        pages += 1;
    } while (startKey && items.length < limit && pages < MAX_PAGES);

    return { items, lastKey: startKey ? String(startKey.id) : undefined };
};
