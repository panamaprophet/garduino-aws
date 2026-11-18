export interface Controller {
    controllerId: string;
    ownerId: string;
    createdAt: string;
}

export const isOwnedBy = (controller: Controller, userId: string) => {
    return controller.ownerId === userId;
};
