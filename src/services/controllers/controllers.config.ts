export const routes = {
    'listControllers': 'GET /v2/controllers',
    'createController': 'POST /v2/controllers',
    'getController': 'GET /v2/controllers/{controllerId}',
    'updateController': 'PATCH /v2/controllers/{controllerId}',
    'removeController': 'DELETE /v2/controllers/{controllerId}',
    'sendCommand': 'POST /v2/controllers/{controllerId}/commands',
    'rotateCertificate': 'POST /v2/controllers/{controllerId}/certificate',
};

export const topics = {
    'commands': (controllerId: string) => `controllers/${controllerId}/commands`,
    'device': (controllerId: string) => `controllers/${controllerId}/*`,
};
