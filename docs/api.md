# HTTP API v2

The public API of the garduino backend, used by the web app and the MCP server. The base URL is the `ApiUrl` stack output; every path below starts with `/v2`.

## Conventions

### Authentication

Every request needs a Cognito access token in the `Authorization` header:

```
Authorization: Bearer <access token>
```

See [auth.md](auth.md) for how to obtain one and which client may call which routes.

### Responses

Successful responses wrap the payload in `data` and add `meta`:

```json
{
    "data": { "controllerId": "…", "name": "Growbox" },
    "meta": { "requestId": "c1d2…" }
}
```

Errors returned by a handler share one shape:

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid request body",
        "details": [{ "path": "name", "message": "Too small: expected string to have >=1 characters" }]
    }
}
```

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | invalid path parameters, query parameters or body; `details` lists every issue |
| 404 | `NOT_FOUND` | the controller disappeared between authorization and the handler (a concurrent delete) |
| 500 | `INTERNAL` | anything unexpected; the cause is only logged |

API Gateway answers some requests before a handler runs, with its own body (`{ "message": … }`):

| Status | When |
|---|---|
| 401 | no `Authorization` header |
| 403 | invalid or expired token, a read-only client calling a write route, or a `{controllerId}` that does not exist or belongs to someone else. Missing and foreign controllers are indistinguishable on purpose. |
| 429 | more than 5 requests per second (burst 10) |

### Values

- **Instants** are RFC 3339 strings. Responses always use UTC with milliseconds (`2026-11-19T10:00:00.000Z`); inputs accept any offset (`2026-11-19T11:00:00+01:00`).
- **Durations** are integers with a unit suffix (`durationMs`).
- **Times of day** in schedules are `HH:mm` in UTC. Clients convert them for display.
- Request bodies are strict: unknown fields are rejected.

### Pagination

`GET /telemetry` pages with an opaque `cursor`. A response carries `meta.pagination.nextCursor` while more items exist and `null` on the last page. To fetch the next page, send only `cursor`: it carries the original query (range, order, limit, types), so other parameters are ignored.

## Controllers

### `GET /v2/controllers`

Lists the caller's controllers.

```json
{
    "data": [
        {
            "controllerId": "6f1c…",
            "name": "Growbox",
            "createdAt": "2026-11-19T10:00:00.000Z",
            "updatedAt": "2026-11-19T10:00:00.000Z"
        }
    ]
}
```

### `POST /v2/controllers`

Provisions a controller: creates the IoT thing, issues an active certificate bound to the shared device policy and stores the controller with the caller as owner. Responds `201`.

Body:

```json
{ "name": "Growbox" }
```

`name` is trimmed and must be 1–64 characters.

Response:

```json
{
    "data": {
        "controllerId": "6f1c…",
        "name": "Growbox",
        "createdAt": "2026-11-19T10:00:00.000Z",
        "updatedAt": "2026-11-19T10:00:00.000Z",
        "certificates": {
            "root": "-----BEGIN CERTIFICATE-----…",
            "pem": "-----BEGIN CERTIFICATE-----…",
            "privateKey": "-----BEGIN RSA PRIVATE KEY-----…",
            "publicKey": "-----BEGIN PUBLIC KEY-----…"
        },
        "endpoint": "a1b2c3…-ats.iot.eu-west-1.amazonaws.com"
    }
}
```

The private key is returned only here and cannot be retrieved later. [devices.md](devices.md) shows how these values map onto the controller's files.

### `GET /v2/controllers/{controllerId}`

Returns one controller in the shape of the list items.

### `PATCH /v2/controllers/{controllerId}`

Renames a controller and returns it.

```json
{ "name": "Balcony" }
```

### `DELETE /v2/controllers/{controllerId}`

Deactivates every certificate of the controller, which disconnects the device immediately, and deletes the controller. Returns the deleted controller and the ids of the revoked certificates:

```json
{
    "data": {
        "controllerId": "6f1c…",
        "name": "Growbox",
        "createdAt": "2026-11-19T10:00:00.000Z",
        "updatedAt": "2026-11-19T10:00:00.000Z",
        "revokedCertificates": ["9a8b…"]
    }
}
```

Settings and telemetry of a deleted controller stay stored but are no longer reachable through the API.

### `POST /v2/controllers/{controllerId}/certificate`

Rotates the device certificate: issues a new one, then deactivates all previous ones. The device stays offline until it is flashed with the new files.

```json
{
    "data": {
        "controllerId": "6f1c…",
        "certificates": { "root": "…", "pem": "…", "privateKey": "…", "publicKey": "…" },
        "endpoint": "a1b2c3…-ats.iot.eu-west-1.amazonaws.com",
        "revokedCertificates": ["9a8b…"]
    }
}
```

### `POST /v2/controllers/{controllerId}/commands`

Sends a command to the device over MQTT. Responds `202`: delivery is fire-and-forget, and the device's reaction shows up in telemetry.

| Body | Effect | Shows up as |
|---|---|---|
| `{ "type": "reboot" }` | restarts the device | `boot` |
| `{ "type": "refresh" }` | asks for a fresh reading | `telemetry` |
| `{ "type": "firmware.update", "firmwareKey": "…", "md5": "…" }` | over-the-air update with a build from `GET /v2/firmware` | `firmware:update`, then `boot` |

`firmwareKey` and `md5` must be taken from the firmware list; the backend builds the download URL itself.

```json
{ "data": { "type": "refresh", "issuedAt": "2026-11-19T10:00:00.000Z" } }
```

## Settings

Settings are grouped by module. A controller without stored settings uses the defaults.

| Field | Rule | Default |
|---|---|---|
| `light.onTime` | `HH:mm`, UTC | `12:00` |
| `light.durationMs` | integer, 0–86400000 | `43200000` (12 h) |
| `fan.defaultSpeed` | integer, 0–255 | `125` |
| `sensor.thresholdTemperature` | integer, 0–100 (°C); while the temperature rises at or above it, the fan steps up | `30` |

### `GET /v2/controllers/{controllerId}/settings`

```json
{
    "data": {
        "light": { "onTime": "05:00", "durationMs": 64800000 },
        "fan": { "defaultSpeed": 125 },
        "sensor": { "thresholdTemperature": 30 }
    }
}
```

### `PATCH /v2/controllers/{controllerId}/settings`

Merges a partial update into the stored settings, saves them and publishes the full settings to the device, which applies them without a reboot and reports `settings:applied`. Returns the full settings.

```json
{ "light": { "onTime": "05:00" } }
```

## Telemetry

Everything a controller reports is stored as an event: `{ id, type, ts, data }`, where `id` is `<13-digit ms timestamp>#<type>`. Event types and payloads are described in [events.md](events.md).

### `GET /v2/controllers/{controllerId}/telemetry`

Raw events in a time range.

| Parameter | Default | Rule |
|---|---|---|
| `from` | `to` minus 24 h | RFC 3339 |
| `to` | now | RFC 3339, not before `from`, at most 31 days after it |
| `order` | `desc` | `asc` or `desc` |
| `limit` | `100` | 1–1000 |
| `types` | all | comma-separated, e.g. `boot,connection` |
| `cursor` | | from a previous page; replaces all other parameters |

```json
{
    "data": [
        {
            "id": "1795082400000#telemetry",
            "type": "telemetry",
            "ts": "2026-11-19T10:00:00.000Z",
            "data": {
                "light": { "isOn": true },
                "fan": { "speed": 125 },
                "sensor": { "temperature": 24.5, "humidity": 61, "stabilityFactor": 1 }
            }
        }
    ],
    "meta": {
        "pagination": { "nextCursor": "eyJmcm9t…", "limit": 100 },
        "query": { "from": "2026-11-18T10:00:00.000Z", "to": "2026-11-19T10:00:00.000Z" }
    }
}
```

With `types`, a page can hold fewer than `limit` events, even none, and still carry a `nextCursor`: the filter is applied after DynamoDB reads a page.

### `GET /v2/controllers/{controllerId}/telemetry/summary`

Aggregates in fixed buckets, computed from raw events.

| Parameter | Default | Rule |
|---|---|---|
| `from`, `to` | the last 24 h | as above, at most 31 days |
| `interval` | `1h` | `10m`, `1h` or `1d`; at most 1000 buckets, so `10m` covers about 7 days |

Buckets are aligned to UTC (`1d` buckets start at midnight UTC) and empty buckets are included, so gaps in reporting stay visible.

```json
{
    "data": [
        {
            "start": "2026-11-19T10:00:00.000Z",
            "end": "2026-11-19T11:00:00.000Z",
            "readings": {
                "sensor.temperature": { "min": 23.1, "max": 25.4, "avg": 24.2 },
                "sensor.humidity": { "min": 51, "max": 58, "avg": 54.6 },
                "fan.speed": { "min": 125, "max": 160, "avg": 131 }
            },
            "events": { "telemetry": 6, "fan:change": 1 }
        }
    ],
    "meta": {
        "query": { "from": "2026-11-18T10:00:00.000Z", "to": "2026-11-19T10:00:00.000Z", "interval": "1h" }
    }
}
```

- `readings` covers every numeric field of `telemetry` events, keyed `<module>.<field>`; `avg` is rounded to two decimals.
- `events` counts every event type in the bucket. `events.telemetry` below the expected 6 per hour means the device was offline or not reporting.

### `GET /v2/controllers/{controllerId}/telemetry/latest`

The newest event of each type in one read: the current state of each module, online status, firmware version and declared modules.

```json
{
    "data": {
        "boot": { "id": "…#boot", "type": "boot", "ts": "…", "data": { "firmwareVersion": "2.0.0", "protocolVersion": 2, "modules": ["fan", "light", "sensor"], "resetReason": "Power On" } },
        "connection": { "id": "…#connection", "type": "connection", "ts": "…", "data": { "online": true } },
        "telemetry": { "id": "…#telemetry", "type": "telemetry", "ts": "…", "data": { "…": "…" } },
        "light:change": { "id": "…#light:change", "type": "light:change", "ts": "…", "data": { "light": { "isOn": false } } }
    }
}
```

The last time the device was seen is the newest `ts` among these events.

## Firmware

### `GET /v2/firmware`

Lists firmware builds in the firmware bucket, newest first.

```json
{
    "data": [
        { "key": "garduino-2.0.0.bin", "lastModified": "2026-11-19T10:00:00.000Z", "size": 412336, "md5": "5d41402abc4b2a76b9719d911017c592" }
    ]
}
```

`md5` comes from the S3 ETag, which is only an MD5 for single-part uploads; firmware builds are small enough to upload in one part.

## Access by client

| Client | Routes |
|---|---|
| web | all |
| MCP | `GET` only |
