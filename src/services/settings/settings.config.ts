export const routes = {
    'getSettings': 'GET /v2/controllers/{controllerId}/settings',
    'updateSettings': 'PATCH /v2/controllers/{controllerId}/settings',
};

export const topics = {
    'request': 'controllers/+/settings/get',
    'settings': (controllerId: string) => `controllers/${controllerId}/settings`,
};
