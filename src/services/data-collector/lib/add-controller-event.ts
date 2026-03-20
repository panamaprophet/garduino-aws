import { randomUUID } from 'crypto';
import { put } from '@/lib/db';

export const addControllerEvent = async (controllerId: string, payload: { [k: string]: any }) => {
    return put(process.env.DATA_TABLE, {
        ...payload,
        controllerId,
        id: randomUUID(),
        ts: Date.now(),
    });
};
