export interface Controller {
    controllerId: string;
    ownerId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
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

export const toControllerResponse = ({ controllerId, name, createdAt, updatedAt }: Controller) => ({
    controllerId,
    name,
    createdAt,
    updatedAt,
});
