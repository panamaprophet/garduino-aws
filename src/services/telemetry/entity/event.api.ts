import { put, query, queryAll } from '@/shared/db';
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

const toRangeAttributes = (controllerId: string, { from, to }: Range) => ({
    '#controllerId': 'controllerId',
    ':controllerId': controllerId,
    '#id': 'id',
    ':from': toEventId(from, ''),
    ':to': toEventId(to, '~'),
});

const toTypeFilter = (types: string[]) => {
    if (types.length === 0) {
        return { filter: undefined, attributes: {} };
    }

    const values = Object.fromEntries(types.map((type, index) => [`:type${index}`, type]));
    const filter = `#type IN (${Object.keys(values).join(', ')})`;

    return { filter, attributes: { '#type': 'type', ...values } };
};

export const saveEvent = async (event: ControllerEvent) => {
    await put(process.env.EVENTS_TABLE, { ...event });

    return event;
};

export const saveLatestEvent = async (event: ControllerEvent) => {
    const isSaved = await put(process.env.LATEST_TABLE, { ...event }, {
        condition: 'attribute_not_exists(#ts) OR #ts < :ts',
        attributes: { '#ts': 'ts', ':ts': event.ts },
    });

    return isSaved ? event : null;
};

export const listLatestEvents = (controllerId: string) => {
    return queryAll<ControllerEvent>(process.env.LATEST_TABLE, '#controllerId = :controllerId', {
        attributes: {
            '#controllerId': 'controllerId',
            ':controllerId': controllerId,
        },
    });
};

export const listEvents = (controllerId: string, range: Range) => {
    const attributes = toRangeAttributes(controllerId, range);

    return queryAll<ControllerEvent>(process.env.EVENTS_TABLE, RANGE_CONDITION, { attributes });
};

export const listEventsPage = async (controllerId: string, { order, limit, types, lastKey, ...range }: EventQuery) => {
    const { filter, attributes } = toTypeFilter(types);
    const rangeAttributes = toRangeAttributes(controllerId, range);
    const items: ControllerEvent[] = [];

    let startKey: Record<string, unknown> | undefined = lastKey ? { controllerId, id: lastKey } : undefined;
    let pages = 0;

    do {
        const page = await query<ControllerEvent>(process.env.EVENTS_TABLE, RANGE_CONDITION, {
            attributes: { ...rangeAttributes, ...attributes },
            filter,
            limit: limit - items.length,
            scanForward: order === 'asc',
            startKey,
        });

        items.push(...page.items);
        startKey = page.lastKey;
        pages += 1;
    } while (startKey && items.length < limit && pages < MAX_PAGES);

    return { items, lastKey: startKey ? String(startKey.id) : undefined };
};
