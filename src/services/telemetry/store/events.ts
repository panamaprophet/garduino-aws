import { put, queryAll } from '@/lib/db';
import { ControllerEvent } from '../domain/event';

interface StoredEvent extends ControllerEvent {
    sk: string;
}

interface Range {
    from: number;
    to: number;
}

const toSortKey = (ts: number, suffix: string) => `${String(ts).padStart(13, '0')}#${suffix}`;

const fromStoredEvent = ({ controllerId, id, type, ts, data }: StoredEvent): ControllerEvent => ({
    controllerId,
    id,
    type,
    ts,
    data,
});

export const saveEvent = async (event: ControllerEvent) => {
    await put(process.env.EVENTS_TABLE, {
        ...event,
        sk: toSortKey(event.ts, event.id),
    });

    return event;
};

export const listEvents = async (controllerId: string, { from, to }: Range) => {
    const items = await queryAll<StoredEvent>(
        process.env.EVENTS_TABLE,
        '#controllerId = :controllerId AND #sk BETWEEN :from AND :to',
        {
            attributes: {
                '#controllerId': 'controllerId',
                ':controllerId': controllerId,
                '#sk': 'sk',
                ':from': toSortKey(from, ''),
                ':to': toSortKey(to, '~'),
            },
            scanForward: false,
        },
    );

    return items.map(fromStoredEvent);
};
