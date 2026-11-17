# Garduino v2 Plan

Redesign of the garduino backend around separated services, and a v2 public API that serves the web frontend and a read-only MCP server well: cursor pagination, explicit ordering, bounded ranges and page sizes, optional field selection, consistent time representation, response metadata, strict device event schemas.

v2 is delivered in one go on `feature/v2`. `/v1` is dropped without a transition period: it has no consumers besides the frontend, which moves to v2 as part of the same effort, and the only controller has been offline since June 2026, so no device needs the v1 protocol either.

Repositories:

| Repo | Role |
|---|---|
| `garduino-aws` (this repo) | backend services, HTTP API, IoT wiring |
| `garduino-controller` | ESP8266 firmware |
| `garduino-web` | frontend, a client of the public API |
| `garduino-mcp` (new) | read-only MCP server, a client of the public API |

## Constraints

- **Cost stays at the free tier.** DynamoDB stays on provisioned capacity (the always-free tier covers 25 RCU / 25 WCU / 25 GB of provisioned capacity only), no auto scaling, bounded log retention, throttled HTTP API.
- **MCP is read-only**, enforced by the API, not only by the MCP server.
- **Data is kept forever.** At one telemetry event per 10 minutes a controller produces ~52k events (~10 MB) per year.
- **Controllers are soft-deleted**: hidden, device access revoked, history kept.
- **Controllers are modular.** Light, fan and sensor are the first modules; new ones (watering, camera, …) must not require changes outside the services that deal with them.

## Findings

### Security (account level)

| Finding | Status |
|---|---|
| Identity pool allowed guest (unauthenticated) identities, and the guest role had `AWSIoTFullAccess` | Fixed in phase 0 |
| Authenticated identity pool role had `AWSIoTFullAccess` and `AWSIoTConfigAccess` | Fixed in phase 0 (only `AWSIoTDataAccess` remains, needed by the frontend until it moves to v2) |
| User pool allowed self sign-up | Fixed in phase 0 |
| Identity pool listed app clients that no longer exist | Fixed in phase 0 |
| IoT policies with `Action: *` / `Resource: *` attached to the Cognito identity | Cutover (identity pool removal) |
| Device certificates share a wildcard IoT policy: any device can publish to any controller's topics, including firmware updates | Controllers service + certificate rotation |
| Stray certificates (most active ones are attached to no thing), an orphaned thing, legacy per-device policies | Cutover |

### Security (application level)

- No ownership checks: any authenticated user can read and modify any controller by id.
- `PUT /v1/controllers/{id}` writes the request body as is: `ownerId` and `controllerId` in the body override the stored ones.
- The firmware update command accepts any URL; md5 protects against corruption, not against a malicious source.

### Design

- Services are split by technical job (configuration, data-collector, firmware), not by responsibility. The configuration record mixes ownership, device behaviour and (through provisioning) IoT identity, so anything that needs ownership reads configurations.
- Tables are passed between CDK constructs; nothing prevents a service from reading another service's data.
- All tables and the firmware bucket use `RemovalPolicy.DESTROY`.

### Correctness

- Event queries ignore `LastEvaluatedKey`, silently truncating at 1 MB.
- Invalid `startDate` / `endDate` silently fall back to the last 24 hours.
- `GET /v1/controllers/{id}` returns `200 null` for a missing controller; `?raw=false` is treated as true.
- `DELETE /v1/controllers/{id}` leaves the IoT thing, certificate and policy behind.
- Configuration changes reach the device only after a reboot, although the firmware already re-applies anything published to it.
- The light schedule on the device is a countdown (`switchIn -= 5000` per tick) refreshed only at boot, so it drifts.
- When the sensor fails, the firmware reports the last (or initial `0/0`) values as real readings.

### Data

- Events table key is `(id, ts)`; every read goes through the `controllerId_Index` GSI, which doubles write capacity usage.
- An orphaned events table from an older stack holds most of the history and is not read by anything.
- Stored events come in several shapes: flat v1 telemetry, `run` with `isOn`, nested telemetry, `light:switch`, `firmware:*`.
- Firmware and frontend disagree on event types, the firmware version is only available through a transient MQTT request/response, fan step-ups are never reported.

## Architecture

### Services

Each service owns its data and its device topics. No service reads another service's table or calls another service. Composition happens only at the edge (the authorizer) and in clients (web, MCP).

| Service | Responsible for | Owns |
|---|---|---|
| **controllers** | identity, ownership, lifecycle (provision, rename, soft delete, certificate rotation), presence, declared modules, commands, the access authorizer | `controllers` table |
| **settings** | desired behaviour per module, defaults, delivery to the device | `settings` table |
| **telemetry** | ingestion, events, hourly rollups, summaries, latest readings | `events` table |
| **firmware** | build catalogue | firmware bucket |

- CDK constructs expose functions and route/topic wiring only, never tables.
- Settings without a stored item fall back to module defaults, so provisioning a controller does not write into the settings service.
- `timezone` is a device-wide setting next to the modules, not part of the light module: every future scheduled module needs it too. It defaults to `UTC`. The API takes an IANA name; the device gets the matching POSIX TZ string, which is the footer line of the zone's tzdata file (`CET-1CEST,M3.5.0,M10.5.0/3` for `Europe/Berlin`). A generated name → POSIX map is vendored in the settings service and doubles as the list of accepted zones.
- Soft delete needs no cross-service events: settings and telemetry keep their data, the authorizer stops granting access to it.
- The firmware update command takes a `firmwareKey`; the controllers service builds the URL from the bucket base URL it gets as configuration, it does not read the bucket.

### Modules

A module is a part of the controller (light, fan, sensor). Each module may have settings, readings and events, and each service describes only its own side of a module:

```
src/services/settings/modules/light/light.schema.ts      settings + defaults
src/services/telemetry/modules/light/light.schema.ts     readings + events
```

- Adding a module = a schema file per service that cares + firmware support. Nothing else changes.
- The device declares its modules in its `boot` event; the controllers service stores them as `device.modules`, clients use that list to decide what to show.
- Settings, telemetry payloads and summary metrics are grouped by module (`light.isOn`, `sensor.temperature`, `fan.speed`).
- Devices ignore settings for modules they do not have.

### Layout

```
src/
  lib/                     shared tooling only, no domain: http, errors, validation, db, mqtt, time
  services/<service>/
    domain/                types and pure logic
    store/                 the only code that knows table names and keys
    http/<handler>/        thin handlers + <entity>.schema.ts
    device/<handler>/      IoT topic handlers + <entity>.schema.ts
    modules/<module>/      module schemas (settings, telemetry)
cdk/
  constructs/<service>.ts  one construct per service
  lib/                     shared CDK helpers
```

- Zod schemas live in `<entity>.schema.ts` next to where they are used; domain and store code take plain types.
- Handlers parse input, call domain/store code and return its result. Functions that check something return what they checked, so a call's result is always used.

### Access

One Lambda authorizer on every HTTP route, owned by the controllers service:

1. Verifies the Cognito token with `aws-jwt-verify` (user pool, allowed app clients: web, MCP).
2. Applies the client policy: the web client may call every route, the MCP client only `GET` routes.
3. For routes with `{controllerId}`, reads the controller and checks `ownerId === sub`. Missing, foreign and deleted controllers are denied alike, so the API does not reveal which ids exist.
4. Passes `userId` and `controllerId` to the handler in the authorizer context.

- Denials return `403` with API Gateway's own body (HTTP APIs cannot customise authorizer responses); invalid tokens return `401`. Every other error uses the error envelope.
- Caching is off: one authorizer invocation and one `GetItem` per request, well within the free tier at this traffic.
- The MCP app client is added to the existing user pool from CDK (`UserPool.fromUserPoolId(...).addClient(...)`): public client, authorization code + PKCE, localhost callback.

## API conventions

- **Instants**: RFC 3339 with milliseconds. Responses always use UTC (`2026-11-17T10:00:00.000Z`); inputs accept any offset (`2026-11-17T11:00:00+01:00`) and are normalised.
- **Durations**: integers with a unit suffix (`durationMs`).
- **Time of day** (recurring schedules): local `HH:mm`, interpreted in the controller's `timezone` (IANA name, e.g. `Europe/Berlin`) from the settings. Not an instant, so not an RFC 3339 string: a fixed offset would shift the schedule by an hour at every DST change, and the date part would be meaningless for a daily schedule.
- **Success**: `{ "data": …, "meta": { "requestId", "pagination"?: { "nextCursor", "limit" }, "query"? } }`. `meta.query` echoes the resolved `from` / `to`.
- **Errors**: `{ "error": { "code", "message", "details"? } }`: `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401, `NOT_FOUND` 404, `PRECONDITION_FAILED` 412, `RATE_LIMITED` 429, `INTERNAL` 500. Messages are actionable.
- **Cursor**: opaque base64url of `{ v, lastKey, query }`. Follow-up requests send only `cursor`; a cursor combined with different filters is a 400. When a filter is applied the server reads at most 5 DynamoDB pages per request, so a page may be shorter than `limit` and still carry a `nextCursor`. No signing: the key condition always comes from the path controller, which the authorizer already checked.
- **Optimistic concurrency**: `ETag` on reads, `If-Match` on PATCH, `412` on mismatch.
- **No totals**: DynamoDB cannot count cheaply.

## HTTP API v2

| Method | Path | Service | Notes | MCP |
|---|---|---|---|---|
| GET | `/v2/controllers` | controllers | paginated; `name`, `device { connected, firmwareVersion, modules, lastBootAt }` | ✓ |
| POST | `/v2/controllers` | controllers | provision; returns certificates | |
| GET | `/v2/controllers/{id}` | controllers | | ✓ |
| PATCH | `/v2/controllers/{id}` | controllers | `name`, `If-Match` | |
| DELETE | `/v2/controllers/{id}` | controllers | soft delete + IoT revocation | |
| POST | `/v2/controllers/{id}/commands` | controllers | `reboot` \| `refresh` \| `firmware.update { firmwareKey }`; 202 with `issuedAt`, `connected` | |
| GET | `/v2/controllers/{id}/settings` | settings | `timezone` and all modules with defaults applied; `light.schedule { isOn, nextSwitchAt }` derived | ✓ |
| PATCH | `/v2/controllers/{id}/settings` | settings | `timezone` and/or partial modules (`{ "timezone": "Europe/Berlin", "light": { "onTime": "06:00" } }`), `If-Match`; publishes the full settings to the device | |
| GET | `/v2/controllers/{id}/events` | telemetry | `from`, `to` (≤ 31 days, default 24 h), `order` (`desc` default), `limit` (100, max 1000), `types`, `fields`, `cursor` | ✓ |
| GET | `/v2/controllers/{id}/telemetry/summary` | telemetry | `from`, `to`, `bucket` = `10m` (≤ 7 days, raw) / `1h` (≤ 92 days) / `1d` (≤ 366 days), `metrics`; buckets `{ start, end, count, "sensor.temperature": { avg, min, max }, … }` | ✓ |
| GET | `/v2/controllers/{id}/telemetry/latest` | telemetry | latest reading per module | ✓ |
| GET | `/v2/firmware` | firmware | paginated, ISO dates, `version` parsed from the key | ✓ |

- Combined views (controller list with latest readings) are composed by the client. A batch `latest` endpoint is added only if that becomes chatty.
- The commands endpoint lets the frontend stop publishing to MQTT entirely (refresh = command + polling `latest`), which allows removing the identity pool.

## Data

### Tables

| Table | PK | SK | Content |
|---|---|---|---|
| controllers | `controllerId` | | `ownerId` \| `deletedOwnerId`, `name`, `createdAt`, `updatedAt`, `deletedAt?`, `certificateArn`, `version`, `device { connected, connectedAt, disconnectedAt, firmwareVersion, protocolVersion, modules, lastBootAt }` |
| settings | `controllerId` | | `timezone`, `modules { light: {…}, fan: {…}, sensor: {…} }`, `version`, `updatedAt` |
| events | `controllerId` | `<ts, 13 digits>#<id>` | `type`, `ts`, `receivedAt`, `data` |
| events (rollup) | `<controllerId>#1h` | `<hour start ts>` | `count`, per-metric `{ sum, min, max }`, `light.onCount` |

- `controllers` has a sparse `ownerId_Index`. **Soft delete** sets `deletedAt` and renames `ownerId` to `deletedOwnerId`, which removes the item from the index; the IoT identity is revoked (policy detached, certificate deactivated and deleted, thing deleted).
- Presence comes from IoT lifecycle events (`$aws/events/presence/{connected,disconnected}/<clientId>`), not from a "last seen within N minutes" heuristic.
- `events` has no GSI. Rollups are produced by a scheduled Lambda (EventBridge Scheduler) every hour for the previous hour; a rollup is a full overwrite, so it is idempotent and the same code backfills history. Summaries combine closed-hour rollups with raw events for the open hour. Per-bucket `count` exposes gaps (device offline) instead of hiding them.
- Telemetry does not check whether a controller exists: IoT rejects publishes from revoked devices, so nothing reaches ingestion for deleted controllers.
- All tables and the firmware bucket use `RemovalPolicy.RETAIN` and deletion protection.

### Capacity budget (always-free tier: 25 RCU / 25 WCU per account)

| Table | RCU | WCU |
|---|---|---|
| controllers + `ownerId_Index` | 2 + 1 | 1 + 1 |
| settings | 1 | 1 |
| events (no GSI) | 8 | 2 (10 during the backfill) |
| unrelated table in the account | 1 | 1 |
| **steady state** | **13** | **6** |
| during cutover (v1 stack still deployed) | 18 | 18 |

8 eventually consistent RCU read ~64 KB/s, which is why long-range reads use rollups: a year of hourly rollups is ~1 MB, a year of raw events ~9 MB.

## Device protocol v2

| Direction | Topic | Service | Payload |
|---|---|---|---|
| device → cloud | `controllers/<id>/events` | telemetry (all), controllers (`boot` only, via `WHERE type = 'boot'`) | `{ "v": 2, "type": …, … }` |
| device → cloud | `controllers/<id>/settings/get` | settings | `{ "v": 2 }` |
| cloud → device | `controllers/<id>/settings` | settings | `{ "v": 2, "timezone": "CET-1CEST,M3.5.0,M10.5.0/3", "light": { "onTime": "06:00", "durationMs": 43200000 }, "fan": { "defaultSpeed": 125 }, "sensor": { "thresholdTemperature": 30 } }` |
| cloud → device | `controllers/<id>/commands` | controllers | `{ "type": "reboot" \| "refresh" \| "firmware.update", … }` |
| IoT → cloud | `$aws/events/presence/+/+` | controllers | lifecycle events |

Event types:

- `telemetry` every 10 minutes: `{ "light": { "isOn": false }, "fan": { "speed": 125 }, "sensor": { "temperature": 24, "humidity": 67, "stabilityFactor": 1 } }`; `sensor` omitted when there is no valid reading.
- `boot { firmwareVersion, protocolVersion, modules, resetReason }`, `settings:applied`, `light:switch { isOn }`, `fan:change { speed, reason: threshold | reset | settings }`, `sensor:error { message }` (on the ok → error transition), `firmware:update:{started,success,error}`.

IoT rules select `topic(2) AS controllerId, timestamp() AS receivedAt, *`; receive time is the canonical event time (the firmware publishes with QoS 0 and does not buffer offline). Invalid payloads are logged with the validation error and not stored. Rules get an `errorAction` to CloudWatch Logs.

Firmware changes:

- `mqtt.setBufferSize(512)`: the PubSubClient default of 256 bytes includes the topic.
- **Local time**: `configTime(timezone, NTP_PRIMARY, NTP_SECONDARY)` with the POSIX TZ string from the settings, then `localtime_r` instead of `gmtime_r`. The device applies DST transitions itself, offline, for as long as the rules hold.
- **Wall-clock light schedule**, evaluated statelessly on every tick on local seconds since midnight:
  ```
  s = localSecondsSinceMidnight
  start = onTime; end = (start + duration) % 86400
  shouldBeOn = duration >= 86400 || (start < end ? start <= s < end : s >= start || s < end)
  ```
  No extra time sync is needed: `configTime()` starts the SDK SNTP client, which re-syncs hourly.
- Clear sensor values on read failure.
- `boot` with declared modules; `fan:change`, `sensor:error`.
- Accept firmware URLs only from the firmware bucket host.

### IoT authorization

One shared IoT policy defined in CDK, scoped by a thing policy variable:

```json
{ "Effect": "Allow", "Action": "iot:Connect",
  "Resource": "arn:aws:iot:<region>:<account>:client/${iot:Connection.Thing.ThingName}" },
{ "Effect": "Allow", "Action": "iot:Publish",
  "Resource": [
    "arn:aws:iot:<region>:<account>:topic/controllers/${iot:Connection.Thing.ThingName}/events",
    "arn:aws:iot:<region>:<account>:topic/controllers/${iot:Connection.Thing.ThingName}/settings/get"
  ] },
{ "Effect": "Allow", "Action": "iot:Subscribe",
  "Resource": [
    "arn:aws:iot:<region>:<account>:topicfilter/controllers/${iot:Connection.Thing.ThingName}/settings",
    "arn:aws:iot:<region>:<account>:topicfilter/controllers/${iot:Connection.Thing.ThingName}/commands"
  ] },
{ "Effect": "Allow", "Action": "iot:Receive",
  "Resource": [
    "arn:aws:iot:<region>:<account>:topic/controllers/${iot:Connection.Thing.ThingName}/settings",
    "arn:aws:iot:<region>:<account>:topic/controllers/${iot:Connection.Thing.ThingName}/commands"
  ] }
```

The device connects with client id = thing name; IoT resolves the thing attached to the certificate and substitutes its name. Without an attached thing the variable does not resolve and access is denied.

- Provisioning: `CreateThing` → `CreateKeysAndCertificate` → `AttachPolicy(shared)` → `AttachThingPrincipal`. No per-device `CreatePolicy`.
- Deprovisioning: detach policy → detach thing principal → deactivate and delete certificate → delete thing.
- **Certificate rotation** for the existing controller: issue a new certificate for the existing thing with the shared policy, flash it together with firmware v2 when the growbox is relaunched, then delete the old certificate. Keeps the controller id and its history.

## MCP (`garduino-mcp`)

A separate repository: the MCP server is a client of the public API, like the frontend, and shares no code with the backend.

- Local stdio server (`claude mcp add garduino -- npx garduino-mcp`), built on the MCP TypeScript SDK.
- Login: OAuth authorization code + PKCE against the Cognito hosted domain with a localhost callback, using the MCP app client; the refresh token is stored locally with user-only permissions.
- Tools: `list_controllers`, `get_controller`, `get_settings`, `query_events`, `summarize_telemetry`, `get_latest`, `list_firmware`, all `readOnlyHint`, calling `GET` routes only.
- Read-only is enforced twice: the tools only call `GET` routes, and the authorizer rejects anything else for the MCP client.
- Why local first: no hosting, no Cognito dynamic client registration problem, no token passthrough. The same tools can later be served over Streamable HTTP from their own stack if access from claude.ai is wanted.

## Delivery

### `garduino-aws`: `feature/v2`, one draft PR

| # | Step | Done when |
|---|---|---|
| 0 | **Account hardening** (applied in AWS) | ✅ done |
| 1 | **Foundations**: handler wrapper, error model, validation, schemas next to usage, log groups with retention, API throttling | ✅ carried over from the current changes |
| 2 | **Restructure**: controllers / settings / telemetry / firmware services and constructs, own tables (`RETAIN`), `/v1` routes, handlers and `lib/request` removed | each construct exposes no table |
| 3 | **Access**: Lambda authorizer, client policy, MCP app client | foreign and deleted controllers are denied; MCP client cannot `POST` |
| 4 | **Controllers**: provisioning with the shared policy, soft delete + revocation, presence, `boot` ingestion, commands, certificate rotation | v2 controller routes complete |
| 5 | **Settings**: modules with defaults, `ETag` / `If-Match`, delivery on PATCH and on device request | settings reach a device without reboot |
| 6 | **Telemetry**: module schemas, ingestion, events endpoint, rollup Lambda, summary, latest | events and summaries served from the new table |
| 7 | **Migration scripts**: configuration → controllers + settings (`timezone: UTC`, so the stored `onTime` keeps its meaning), both legacy events tables → events + rollups (all historical shapes), firmware objects → new bucket | full history queryable in v2 |
| 8 | **Docs**: README, Postman collection for v2 | |

The stack name is derived from `API_VERSION`, so v2 deploys as a new `garduino-v2` stack next to `garduino-v1`.

### Other repositories

| Repo | Work |
|---|---|
| `garduino-controller` | protocol v2, wall-clock schedule, module declaration in `boot`, buffer size, URL allowlist, sensor errors |
| `garduino-web` | v2 client, summaries for charts, `latest` for status, commands instead of MQTT, no identity pool |
| `garduino-mcp` | new repository, see above |

### Cutover

1. Deploy `garduino-v2`, run the migration scripts.
2. Release the frontend on v2.
3. Relaunch the growbox with firmware v2 and the rotated certificate.
4. Destroy `garduino-v1` and the orphaned legacy events table.
5. Remove the identity pool and its roles; clean stray certificates, things, legacy IoT policies and stale Amplify hosting.

Done when only the user pool remains from Amplify and the capacity is back to the steady-state budget.
