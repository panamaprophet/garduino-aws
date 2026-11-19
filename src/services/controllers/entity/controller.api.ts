import { get, put, queryAll } from '@/shared/db';
import { merge } from '@/shared/object';
import { Controller, markControllerDeleted } from './controller.model';

const replaceActiveController = async (controller: Controller) => {
    const isReplaced = await put(process.env.CONTROLLERS_TABLE, { ...controller }, {
        condition: 'attribute_exists(#ownerId)',
        attributes: { '#ownerId': 'ownerId' },
    });

    return isReplaced ? controller : null;
};

export const getController = (controllerId: string) => {
    return get<Controller>(process.env.CONTROLLERS_TABLE, { controllerId });
};

export const listControllersByOwner = (ownerId: string) => {
    return queryAll<Controller>(process.env.CONTROLLERS_TABLE, '#ownerId = :ownerId', {
        attributes: {
            '#ownerId': 'ownerId',
            ':ownerId': ownerId,
        },
        index: 'ownerId_Index',
    });
};

export const saveController = async (controller: Controller) => {
    await put(process.env.CONTROLLERS_TABLE, { ...controller });

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
