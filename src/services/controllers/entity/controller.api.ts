import { table } from '@/shared/db';
import { merge } from '@/shared/object';
import { Controller, markControllerDeleted } from './controller.model';

const controllersTable = table<Controller>('CONTROLLERS_TABLE');

const replaceActiveController = (controller: Controller) => {
    return controllersTable.put(controller, { condition: 'attribute_exists(#ownerId)' });
};

export const getController = (controllerId: string) => {
    return controllersTable.get({ controllerId });
};

export const listControllersByOwner = (ownerId: string) => {
    return controllersTable.queryAll('#ownerId = :ownerId', { ':ownerId': ownerId }, { index: 'ownerId_Index' });
};

export const saveController = async (controller: Controller) => {
    await controllersTable.put(controller);

    return controller;
};

export const updateController = async (controllerId: string, changes: Partial<Controller>) => {
    const controller = await getController(controllerId);

    if (!controller) {
        return null;
    }

    const updatedAt = new Date().toISOString();
    const updated = merge(controller, { ...changes, updatedAt });

    return replaceActiveController(updated);
};

export const removeController = async (controllerId: string) => {
    const controller = await getController(controllerId);

    if (!controller) {
        return null;
    }

    const deleted = markControllerDeleted(controller);

    return replaceActiveController(deleted);
};
