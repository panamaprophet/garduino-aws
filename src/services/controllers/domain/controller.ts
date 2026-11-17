export interface Controller {
    controllerId: string;
    ownerId: string;
    createdAt: string;
}

export const isAccessibleBy = (controller: Controller | null, userId: string): controller is Controller => {
    return controller !== null && controller.ownerId === userId;
};
