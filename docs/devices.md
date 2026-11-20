# Devices

How a controller is provisioned, connects and gets firmware updates. The firmware lives in the `garduino-controller` repository; this page covers its contract with the backend.

## Provisioning

1. **Create the controller** with a web-client token:

    ```http
    POST /v2/controllers
    Content-Type: application/json

    { "name": "Growbox" }
    ```

    The response carries the `controllerId`, the certificate set and the IoT data `endpoint` ([api.md](api.md#post-v2controllers)). The private key is returned only once.

2. **Write the controller's files** into the firmware's `data/` folder, which is flashed as the LittleFS image:

    | File | Source |
    |---|---|
    | `config.json` | see below |
    | `controller.cert.pem` | `certificates.pem` |
    | `controller.private.key` | `certificates.privateKey` |
    | `controller.key` | `certificates.publicKey` |
    | `root.crt` | `certificates.root` |

    ```json
    {
        "controllerId": "<controllerId>",
        "host": "<endpoint>",
        "wifi": { "ssid": "…", "password": "…" },
        "pins": { "fan": 12, "light": 14, "sensor": 2 }
    }
    ```

    These files hold a private key and Wi-Fi credentials. Keep each controller's set in a git-ignored folder; `garduino-controller` ignores `data.*/`.

3. **Flash** the filesystem image and the firmware with PlatformIO.

4. **Check** that the controller is online: `GET /v2/controllers/{controllerId}/telemetry/latest` shows `connection` with `online: true` and a fresh `boot`.

## Connection

| | |
|---|---|
| Host | the `endpoint` from provisioning (`<prefix>-ats.iot.<region>.amazonaws.com`) |
| Port | 8883, TLS with mutual authentication |
| Trust | `root.crt` (Amazon Root CA 1) |
| Client certificate | `controller.cert.pem` and `controller.private.key` |
| Client id | the `controllerId`; any other id is rejected by the device policy |

After connecting, the controller:

1. requests its settings on `controllers/<id>/settings/get` and applies what arrives on `controllers/<id>/settings`;
2. publishes `boot` with its firmware version, protocol version, modules and reset reason;
3. publishes `telemetry` every 10 minutes and `<module>:change` whenever a module's state changes;
4. listens for commands on `controllers/<id>/commands`.

Connection status needs nothing from the firmware: AWS IoT reports connects and disconnects itself. Topics and payloads are described in [events.md](events.md).

## Schedule

The light schedule is evaluated against UTC wall-clock time on every tick, so it neither drifts nor shifts with daylight saving time:

```
s     = UTC seconds since midnight
start = onTime
end   = (start + duration) mod 86400
on    = duration >= 86400 || (start < end ? start <= s < end : s >= start || s < end)
```

## Certificate rotation and removal

- **Rotation** (`POST /v2/controllers/{id}/certificate`) issues a new certificate and deactivates the old ones at once. The device is offline until its certificate files are replaced and flashed. The `controllerId`, settings and history stay.
- **Removal** (`DELETE /v2/controllers/{id}`) deactivates every certificate and deletes the controller.

## Firmware updates

1. Build the firmware and upload the binary to the `FirmwareBucket` stack output in a single part (as `aws s3 cp` does for small files), so the listed `md5` is correct.
2. `GET /v2/firmware` lists the builds with their `key` and `md5`.
3. `POST /v2/controllers/{id}/commands` with `{ "type": "firmware.update", "firmwareKey": "<key>", "md5": "<md5>" }`. The device receives the download URL built from the bucket, verifies the md5, and reports progress as `firmware:update { status }`, then reboots with a new `boot`.

Objects in the firmware bucket are publicly readable, so devices download without credentials. Firmware builds must not contain secrets.
