# Garduino AWS

AWS backend for garduino garden controllers: provisioning, settings, telemetry and firmware updates over AWS IoT Core, with an HTTP API for the web app and a read-only MCP server.

Built with TypeScript, AWS CDK, Lambda, API Gateway (HTTP API), DynamoDB, IoT Core, S3 and Cognito.

## Services

| Service | Owns | Does |
|---|---|---|
| `controllers` | `controllers` table, IoT things and certificates, the device policy | provisioning, rename, delete, certificate rotation, device commands, the request authorizer |
| `settings` | `settings` table | per-module settings with defaults, delivery to the device on change and on request |
| `telemetry` | `events` and `latest` tables | ingestion of device and connection events, history, summaries, latest state |
| `firmware` | firmware bucket | the list of firmware builds |

Services never read each other's tables or call each other. Each one lives in `src/services/<service>/` with one folder per feature (one Lambda per feature) and an `entity/` folder for its model, schemas and data access. Routes and topics are declared in `<service>.config.ts`; infrastructure is in `cdk/`.

## Documentation

- [docs/api.md](docs/api.md): HTTP API v2 reference
- [docs/auth.md](docs/auth.md): users, clients, request authorization and device certificates
- [docs/devices.md](docs/devices.md): provisioning a controller, connection, firmware updates
- [docs/events.md](docs/events.md): device protocol v2, events and how they are stored
- [docs/garduino.postman_collection.json](docs/garduino.postman_collection.json) with [the environment](docs/garduino.postman_environment.json): the API in Postman

## Configuration

Copy `.env.example` to `.env`:

```
API_VERSION=v2

AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

`API_VERSION` names the deployment: the stack is `garduino-<API_VERSION>`, and every resource name includes it, so versions can run side by side.

The stack creates everything else, including the Cognito user pool. Its outputs:

| Output | Used by |
|---|---|
| `ApiUrl` | web app, MCP server |
| `UserPoolId`, `WebClientId` | web app |
| `McpClientId`, `AuthDomain` | MCP server |
| `FirmwareBucket` | firmware publishing |

## Development

Requires Node.js and [pnpm](https://pnpm.io/) 10+.

```sh
pnpm install
pnpm typecheck
pnpm check        # Biome: lint and formatting
pnpm format       # Biome: apply fixes and formatting
pnpm exec cdk synth
```

## Deployment

```sh
pnpm run deploy
```

Pull requests run the check job of `.github/workflows/deploy.yml`: Biome, the type-check and `cdk synth`. Pushes to `main` run the same checks and then deploy with the GitHub environment `v2`, which needs:

- secrets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- variables `AWS_REGION` and `API_VERSION`

After the first deploy, create a user as described in [docs/auth.md](docs/auth.md#users).

Tables, the firmware bucket and the user pool are retained when the stack is deleted, and tables and the user pool have deletion protection.
