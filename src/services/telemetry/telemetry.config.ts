export const routes = {
    'listEvents': 'GET /v2/controllers/{controllerId}/telemetry',
    'getSummary': 'GET /v2/controllers/{controllerId}/telemetry/summary',
    'getLatest': 'GET /v2/controllers/{controllerId}/telemetry/latest',
};

export const topics = {
    'telemetry': 'controllers/+/telemetry',
    'connection': '$aws/events/presence/+/+',
};
