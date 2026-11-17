export interface ControllerEvent {
    controllerId: string;
    id: string;
    type: string;
    ts: number;
    data: Record<string, unknown>;
}

export const toEventResponse = ({ id, type, ts, data }: ControllerEvent) => ({
    id,
    type,
    ts: new Date(ts).toISOString(),
    data,
});
