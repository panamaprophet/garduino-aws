import { ControllerEvent } from '../../entity/event.model';
import { intervals, SummaryQuery } from './get-summary.schema';

const round = (value: number) => Math.round(value * 100) / 100;

const toIsoString = (ts: number) => new Date(ts).toISOString();

const toStats = (values: number[]) => {
    const sum = values.reduce((total, value) => total + value, 0);

    return { min: Math.min(...values), max: Math.max(...values), avg: round(sum / values.length) };
};

const toMetrics = (data: ControllerEvent['data']) => {
    const modules = Object.entries(data as Record<string, Record<string, unknown>>);

    return modules.flatMap(([module, fields]) => Object.entries(fields)
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
        .map(([field, value]) => [`${module}.${field}`, value] as const));
};

const toBucket = (start: number, size: number, events: ControllerEvent[]) => {
    const counts: Record<string, number> = {};
    const values: Record<string, number[]> = {};

    for (const event of events) {
        counts[event.type] = (counts[event.type] ?? 0) + 1;
    }

    const metrics = events
        .filter((event) => event.type === 'telemetry')
        .flatMap((event) => toMetrics(event.data));

    for (const [name, value] of metrics) {
        values[name] = [...(values[name] ?? []), value];
    }

    const readings = Object.fromEntries(Object.entries(values).map(([name, list]) => [name, toStats(list)]));

    return { start: toIsoString(start), end: toIsoString(start + size), readings, events: counts };
};

export const summarize = (events: ControllerEvent[], { from, to, interval }: SummaryQuery) => {
    const size = intervals[interval];
    const toBucketStart = (ts: number) => Math.floor(ts / size) * size;
    const groups = new Map<number, ControllerEvent[]>();
    const starts: number[] = [];

    for (const event of events) {
        const start = toBucketStart(event.ts);
        const group = groups.get(start) ?? [];

        groups.set(start, [...group, event]);
    }

    for (let start = toBucketStart(from); start <= to; start += size) {
        starts.push(start);
    }

    return starts.map((start) => toBucket(start, size, groups.get(start) ?? []));
};
