# Events

Everything a controller reports, how it travels and where it is stored. Device protocol version 2.

## Channels

| Direction | Topic | Publisher | Handler |
|---|---|---|---|
| device → cloud | `controllers/<id>/telemetry` | device | `telemetry/report-event` |
| device → cloud | `controllers/<id>/settings/get` | device, at boot | `settings/request-settings` |
| AWS IoT → cloud | `$aws/events/presence/{connected,disconnected}/<id>` | AWS IoT | `telemetry/report-event` |
| cloud → device | `controllers/<id>/settings` | `settings` service, on request and on `PATCH /settings` | device |
| cloud → device | `controllers/<id>/commands` | `controllers` service, on `POST /commands` | device |

- `<id>` is the controllerId. It is also the IoT thing name and the MQTT client id.
- The device policy restricts a device to its own `controllers/<id>/*` topics.
- Every device message carries `"v": 2`.

## Device events

Published to `controllers/<id>/telemetry` as `{ "v": 2, "type": …, … }`.

| Type | When | Payload | Purpose |
|---|---|---|---|
| `telemetry` | every 10 minutes and on `refresh` | the state of every module: `{ "light": {…}, "fan": {…}, "sensor": {…} }` | readings for charts and summaries, current state, last seen |
| `<module>:change` | a module's state changes | the state of that module only: `{ "<module>": {…} }` | exact switch times, fan reactions, sensor failures without waiting for the next `telemetry` |
| `boot` | once per start | `{ "firmwareVersion", "protocolVersion", "modules", "resetReason" }` | firmware version, which modules to show, why the device restarted |
| `settings:applied` | settings were applied | `{}` | confirms that a settings change reached the device |
| `firmware:update` | over-the-air update progress | `{ "status": "started" \| "success" \| "error", "message"? }` | update progress and result |

### Module state

A module's state has the same shape in `telemetry` and in `<module>:change`. Both come from the module's `getStatus()`.

| Module | State | Change event fires |
|---|---|---|
| `light` | `{ "isOn": boolean }` | on every switch |
| `fan` | `{ "speed": 0–255 }` | when the speed changes |
| `sensor` | `{ "temperature", "humidity", "stabilityFactor" }` or `{ "error": string }` | when readings start failing and when they recover |

A failing sensor reports `{ "error" }` instead of stale values.

### Examples

```json
{ "v": 2, "type": "telemetry", "light": { "isOn": true }, "fan": { "speed": 125 }, "sensor": { "temperature": 24.5, "humidity": 61, "stabilityFactor": 1 } }
{ "v": 2, "type": "light:change", "light": { "isOn": false } }
{ "v": 2, "type": "fan:change", "fan": { "speed": 160 } }
{ "v": 2, "type": "sensor:change", "sensor": { "error": "timeout" } }
{ "v": 2, "type": "boot", "firmwareVersion": "2.0.0", "protocolVersion": 2, "modules": ["fan", "light", "sensor"], "resetReason": "Power On" }
{ "v": 2, "type": "settings:applied" }
{ "v": 2, "type": "firmware:update", "status": "error", "message": "md5 mismatch" }
```

`resetReason` is the value of `ESP.getResetReason()`, read from hardware after boot, e.g. `Power On`, `Hardware Watchdog`, `Exception`, `Software/System restart`.

## Connection events

The device does not report its connection. AWS IoT publishes lifecycle events on connect and disconnect, and a topic rule turns them into:

```json
{ "type": "connection", "online": false, "reason": "MQTT_KEEP_ALIVE_TIMEOUT" }
```

`reason` is AWS IoT's `disconnectReason` and is present only on disconnect. An abrupt drop (power or Wi-Fi loss) is detected once the MQTT keepalive times out.

## Messages to the device

These are not stored as events. The device's reaction shows up as events.

| Topic | Payload | Device reaction |
|---|---|---|
| `controllers/<id>/settings` | `{ "v": 2, "light": { "onTime": "HH:mm" (UTC), "durationMs" }, "fan": { "defaultSpeed" }, "sensor": { "thresholdTemperature" } }` | `settings:applied` |
| `controllers/<id>/commands` | `{ "v": 2, "type": "reboot" }` | restart, then `boot` |
| | `{ "v": 2, "type": "refresh" }` | `telemetry` |
| | `{ "v": 2, "type": "firmware.update", "url", "md5" }` | `firmware:update` events, then `boot` |

- The backend builds firmware URLs from the firmware bucket.
- Settings are stored in the `settings` table.

## Ingestion and storage

1. **Topic rule.** It adds `controllerId` and `receivedAt`:
   - telemetry: from the topic and the time the rule received the message
   - connection: from the client id and the lifecycle event's own timestamp

   If the handler can't be invoked, the message goes to the `topic-rule-errors` log group.
2. **`report-event`.** It validates the payload against the schema for its `type`. Unknown types and invalid payloads are logged with the validation error and not stored.
3. **`events` table** (`controllerId`, `id`). The event is stored as `{ type, ts, data }` and kept forever.
   - `id` is `<ts, 13 digits>#<type>`, so a retried message overwrites itself.
   - `ts` is the receive time. The firmware publishes with QoS 0 and does not buffer while offline.
4. **`latest` table** (`controllerId`, `type`). The newest event of each type, written only when the event is newer than the stored one. A late `disconnected` from a replaced session never hides a newer `connected`.

## Reading

| Route | Returns |
|---|---|
| `GET /v2/controllers/{id}/telemetry` | raw events; `from`, `to` (≤ 31 days, default 24 h), `order`, `limit` (≤ 1000), `types`, `cursor` |
| `GET /v2/controllers/{id}/telemetry/summary` | per bucket of `interval` = `10m` / `1h` / `1d`: min, max and avg of every numeric `telemetry` reading (`sensor.temperature`, `fan.speed`, …) and a count of events per type |
| `GET /v2/controllers/{id}/telemetry/latest` | the newest event of each type: online status from `connection`, firmware and modules from `boot`, the current state of each module |

## Adding a module

1. Firmware: implement the module with `name()`, `apply()` and `getStatus()`, and call `changed()` when its state changes.
2. Telemetry: add `entity/modules/<module>.schema.ts` with the module's state.
3. Telemetry: add the module to `telemetry` and add a `<module>:change` line in `report-event.schema.ts`.
4. Settings: add `entity/modules/<module>.schema.ts` with settings and defaults, if the module is configurable.

## Legacy events (protocol v1)

Mapped by the migration and rejected by v2 ingestion.

| v1 | v2 |
|---|---|
| `update` with nested modules, or flat `{ temperature, humidity, fanSpeed }` | `telemetry`, with `fan.currentSpeed` / `fanSpeed` becoming `fan.speed` |
| `run` | `settings:applied` |
| `light:switch { isOn }` | `light:change { light: { isOn } }` |
| `firmware:update:started` / `:success` / `:error` | `firmware:update { status, message? }` |
| `reboot` | dropped; `boot` with `resetReason` covers it |
| `firmware/version/pub` | `boot.firmwareVersion` |
