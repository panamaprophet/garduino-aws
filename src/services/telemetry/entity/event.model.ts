export interface ControllerEvent {
    controllerId: string;
    id: string;
    type: string;
    ts: number;
    data: Record<string, unknown>;
}

export const toEventId = (ts: number, type: string) => `${String(ts).padStart(13, '0')}#${type}`;

export const createEvent = (controllerId: string, ts: number, payload: { type: string }): ControllerEvent => {
    const { type, ...data } = payload;
    const id = toEventId(ts, type);

    return { controllerId, id, type, ts, data };
};

export const toEventResponse = ({ id, type, ts, data }: ControllerEvent) => ({
    id,
    type,
    ts: new Date(ts).toISOString(),
    data,
});
