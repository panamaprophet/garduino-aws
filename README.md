# Garduino AWS

AWS IoT cloud backend for garden controller management. Includes a data collector, configuration manager, firmware service, and MQTT message handlers.

Built with TypeScript, AWS CDK, Lambda, DynamoDB, IoT Core, S3, and Cognito.

## API Endpoints

All HTTP endpoints require JWT authorization (AWS Cognito). Base path: `/v1`.

### Controllers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/controllers` | List controller IDs for authenticated user |
| POST | `/v1/controllers` | Provision a new IoT controller (creates Thing, certificates, policy) |
| GET | `/v1/controllers/{controllerId}` | Get controller configuration (add `?raw=true` for stored format) |
| PUT | `/v1/controllers/{controllerId}` | Update controller configuration |
| DELETE | `/v1/controllers/{controllerId}` | Delete controller configuration |

### Data

| Method | Path | Description |
|--------|------|-------------|
| PUT | `/v1/controllers/{controllerId}/data` | Push a sensor data event |
| GET | `/v1/controllers/{controllerId}/data` | Query events by time range (`?startDate=&endDate=`, defaults to last 24h) |

### Firmware

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/firmware` | List available firmware files |
| GET | `/v1/firmware/download?key=...` | Get a pre-signed S3 download URL for a firmware file |

## MQTT Topics

Communication with controllers happens over AWS IoT Core MQTT.

| Topic | Direction | Description |
|-------|-----------|-------------|
| `controllers/{controllerId}/config/pub` | Device -> Cloud | Device requests its configuration. Cloud responds on the `sub` topic. |
| `controllers/{controllerId}/config/sub` | Cloud -> Device | Cloud publishes mapped configuration to the device |
| `controllers/{controllerId}/events/pub` | Device -> Cloud | Device publishes sensor events for storage |

## Configuration Shape

**Stored (raw) configuration:**

```json
{
  "controllerId": "uuid",
  "ownerId": "uuid",
  "onTime": "12:00",
  "duration": 43200000,
  "thresholdTemperature": 30,
  "fanSpeed": 125
}
```

- `onTime` — time of day in `HH:MM` (UTC) when the device turns on
- `duration` — how long the device stays on, in milliseconds
- `thresholdTemperature` — temperature threshold
- `fanSpeed` — fan speed (0-255)

**Mapped (time-relative) configuration** returned by default from `GET /v1/controllers/{controllerId}` and via MQTT:

```json
{
  "isOn": true,
  "switchIn": 18000000,
  "duration": 43200000,
  "fanSpeed": 125,
  "thresholdTemperature": 30
}
```

- `isOn` — whether the device should be on right now
- `switchIn` — milliseconds until the next state change

## Event Shape

Events are flexible — any JSON payload is accepted. The backend adds `id` (UUID) and `ts` (timestamp) automatically.

**Typical event from a controller:**

```json
{
  "fan": { "currentSpeed": 125 },
  "light": { "isOn": true },
  "sensor": {
    "temperature": 25.5,
    "humidity": 60,
    "stabilityFactor": 0.9
  },
  "event": "update"
}
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```
API_VERSION=v1

AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

USER_POOL_ID=user_pool_id
USER_POOL_CLIENT_ID=user_pool_client_id
```

- `API_VERSION` — used to namespace the entire deployment. The CDK stack is named `garduino-{API_VERSION}` (e.g., `garduino-v1`), and all resources (DynamoDB tables, S3 buckets, Lambda functions, API Gateway) include this version in their names. This allows running multiple independent versions of the stack side-by-side.
- `USER_POOL_ID` / `USER_POOL_CLIENT_ID` — AWS Cognito user pool used for JWT authorization on the HTTP API.

## Deployment

### Prerequisites

- Node.js
- [pnpm](https://pnpm.io/) v10+
- AWS credentials configured (via `.env` or AWS CLI)
- AWS Cognito user pool

### Install dependencies

```sh
pnpm install
```

### Deploy

```sh
pnpm run deploy
```

This runs `cdk deploy` which synthesizes and deploys the CloudFormation stack.

### CI/CD

Pushes to `main` trigger a GitHub Actions workflow (`.github/workflows/deploy.yml`) that type-checks and deploys automatically. Required GitHub secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `USER_POOL_ID`, `USER_POOL_CLIENT_ID`. Required GitHub variables: `AWS_REGION`, `API_VERSION`.

### IoT Endpoint

To get the IoT Core endpoint for device connections:

```sh
aws iot describe-endpoint
```

## API Documentation

A Postman collection is available in `docs/garduino.postman_collection.json`.
