export interface Controller {
    controllerId: string;
    ownerId?: string;
    deletedOwnerId?: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

export const createController = (controllerId: string, ownerId: string, name: string): Controller => {
    const now = new Date().toISOString();

    return {
        controllerId,
        ownerId,
        name,
        createdAt: now,
        updatedAt: now,
    };
};

export const markControllerDeleted = ({ ownerId, ...controller }: Controller): Controller => {
    const now = new Date().toISOString();

    return {
        ...controller,
        deletedOwnerId: ownerId,
        deletedAt: now,
        updatedAt: now,
    };
};

export const isOwnedBy = (controller: Controller, userId: string) => {
    return controller.ownerId === userId;
};

export const toControllerResponse = ({ controllerId, name, createdAt, updatedAt }: Controller) => ({
    controllerId,
    name,
    createdAt,
    updatedAt,
});
