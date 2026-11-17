import { get, put, queryAll, remove } from '@/lib/db';
import { Controller } from '../domain/controller';

export const findController = (controllerId: string) => {
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

export const removeController = async (controller: Controller) => {
    await remove(process.env.CONTROLLERS_TABLE, { controllerId: controller.controllerId });

    return controller;
};
