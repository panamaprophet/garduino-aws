import { table } from '@/shared/db';
import { env } from '@/shared/env';
import { merge } from '@/shared/object';
import { Controller } from './controller.model';

const tableName = env('CONTROLLERS_TABLE');
const controllersTable = table<Controller>(tableName);

export const getController = (controllerId: string) => {
    return controllersTable.get({ controllerId });
};

export const listControllers = (ownerId: string) => {
    return controllersTable.queryAll('#ownerId = :ownerId', { ':ownerId': ownerId }, { index: 'ownerId_Index' });
};

export const saveController = (controller: Controller) => {
    return controllersTable.put(controller);
};

export const updateController = async (controllerId: string, changes: Partial<Controller>) => {
    const controller = await getController(controllerId);

    if (!controller) {
        return null;
    }

    const updatedAt = new Date().toISOString();
    const updated = merge(controller, { ...changes, updatedAt });

    return controllersTable.put(updated, { condition: 'attribute_exists(#controllerId)' });
};

export const removeController = (controllerId: string) => {
    return controllersTable.remove({ controllerId });
};
