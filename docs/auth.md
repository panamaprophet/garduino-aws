# Authentication and access

People authenticate with Cognito and reach the backend through the HTTP API. Controllers authenticate with X.509 certificates and reach it over MQTT. The two never share credentials.

## Users

The stack owns the Cognito user pool:

- **Sign-up is admin-only.** Anyone who could sign up could provision IoT resources in the account, so self sign-up is disabled.
- Users sign in with their email address (not case-sensitive). Passwords are at least 12 characters; recovery goes through email.
- The pool is retained when the stack is deleted and has deletion protection.

Create a user after the first deploy:

```sh
aws cognito-idp admin-create-user --user-pool-id <UserPoolId> --username <email>
```

Cognito emails a temporary password, which is replaced at the first sign-in.

## Clients

| Client | Output | Sign-in | Tokens | Access |
|---|---|---|---|---|
| web | `WebClientId` | SRP (as used by Amplify Auth), no OAuth | access 1 h, refresh 30 days | all routes |
| MCP | `McpClientId` | OAuth 2.0 authorization code with PKCE through the Cognito domain (`AuthDomain`) | access 1 h, refresh 30 days | `GET` only |

Both are public clients without a secret, and both support token revocation.

### Web

The web app needs `UserPoolId` and `WebClientId`; Amplify derives the region from the pool id. It needs no identity pool: commands go through `POST /commands` instead of MQTT.

### MCP

The MCP server signs the user in through the browser:

1. It opens `<AuthDomain>/oauth2/authorize` with `client_id=<McpClientId>`, `response_type=code`, `scope=openid`, a PKCE challenge and `redirect_uri=http://localhost:<port>/callback`.
2. Cognito redirects back to that local address with a code.
3. The MCP exchanges the code and the PKCE verifier at `<AuthDomain>/oauth2/token` for access and refresh tokens, and refreshes them there.

Allowed redirect ports are 8765, 8766 and 8767, so up to three instances can sign in on one machine. Every installation shares the same client id and keeps its own tokens; they belong in the OS keychain.

## Request authorization

Every route goes through one Lambda authorizer (`controllers/authorize-request`), with caching disabled:

1. It verifies the access token with `aws-jwt-verify`: signature, expiry, `token_use: access` and a client id of either the web or the MCP client.
2. The MCP client is limited to `GET` and `HEAD`.
3. For routes with `{controllerId}`, it reads the controller and requires `ownerId` to match the token's `sub`. Missing and foreign controllers are denied alike (403), so the API never reveals which ids exist.
4. On success it passes the user id to the handler, which uses it as the owner of new controllers and to list the caller's controllers.

Tokens are verified locally, so a revoked access token stays valid until it expires (at most 1 hour). To end every session of a user at once:

```sh
aws cognito-idp admin-user-global-sign-out --user-pool-id <UserPoolId> --username <email>
```

## Devices

Each controller is an IoT thing named after its `controllerId`, with one active certificate. All certificates are attached to one shared IoT policy (`<stack name>-device`), which uses the thing name as a policy variable:

| Action | Resource |
|---|---|
| `iot:Connect` | client id `${iot:Connection.Thing.ThingName}` |
| `iot:Publish`, `iot:Receive` | topics `controllers/${iot:Connection.Thing.ThingName}/*` |
| `iot:Subscribe` | topic filters `controllers/${iot:Connection.Thing.ThingName}/*` |

A device can therefore only connect with its own controllerId as the MQTT client id and only use its own topics. New topics under `controllers/<id>/` need no policy change.

- Certificates are issued by `POST /controllers` and `POST /controllers/{id}/certificate`; the private key is shown only in that response.
- Revoking means deactivating: `DELETE /controllers/{id}` and certificate rotation set the old certificates to `INACTIVE`, which locks the device out immediately. Inactive certificates and things are left in place; they cost nothing.

[devices.md](devices.md) covers provisioning a controller end to end.
