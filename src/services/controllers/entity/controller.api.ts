import { get, put, queryAll } from '@/shared/db';
import { applyControllerChanges, Controller, ControllerChanges, markControllerDeleted } from './controller.model';

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

export const updateController = async (controllerId: string, changes: ControllerChanges) => {
    const controller = await getController(controllerId);

    if (!controller) {
        return null;
    }

    return replaceActiveController(applyControllerChanges(controller, changes));
};

export const removeController = async (controllerId: string) => {
    const controller = await getController(controllerId);

    if (!controller) {
        return null;
    }

    return replaceActiveController(markControllerDeleted(controller));
};
