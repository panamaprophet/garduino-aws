import { Construct } from 'constructs';
import { Duration, Fn, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AccountRecovery, OAuthScope, UserPool, UserPoolClientIdentityProvider } from 'aws-cdk-lib/aws-cognito';

const MCP_CALLBACK_PORTS = [8765, 8766, 8767];

export class Auth extends Construct {
    readonly userPoolId: string;
    readonly webClientId: string;
    readonly mcpClientId: string;
    readonly domainUrl: string;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const { stackName, stackId } = Stack.of(this);

        const stackUuid = Fn.select(2, Fn.split('/', stackId));
        const domainSuffix = Fn.select(4, Fn.split('-', stackUuid));
        const mcpCallbackUrls = MCP_CALLBACK_PORTS.map((port) => `http://localhost:${port}/callback`);

        const userPool = new UserPool(this, 'user-pool', {
            userPoolName: `${stackName}-users`,
            selfSignUpEnabled: false,
            signInAliases: { email: true },
            signInCaseSensitive: false,
            autoVerify: { email: true },
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            passwordPolicy: { minLength: 12 },
            removalPolicy: RemovalPolicy.RETAIN,
            deletionProtection: true,
        });

        const domain = userPool.addDomain('domain', {
            cognitoDomain: { domainPrefix: `${stackName}-${domainSuffix}` },
        });

        const webClient = userPool.addClient('web-client', {
            userPoolClientName: `${stackName}-web`,
            generateSecret: false,
            authFlows: { userSrp: true },
            disableOAuth: true,
            preventUserExistenceErrors: true,
            enableTokenRevocation: true,
            accessTokenValidity: Duration.hours(1),
            refreshTokenValidity: Duration.days(30),
        });

        const mcpClient = userPool.addClient('mcp-client', {
            userPoolClientName: `${stackName}-mcp`,
            generateSecret: false,
            oAuth: {
                flows: { authorizationCodeGrant: true },
                scopes: [OAuthScope.OPENID],
                callbackUrls: mcpCallbackUrls,
            },
            supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
            preventUserExistenceErrors: true,
            enableTokenRevocation: true,
            accessTokenValidity: Duration.hours(1),
            refreshTokenValidity: Duration.days(30),
        });

        this.userPoolId = userPool.userPoolId;
        this.webClientId = webClient.userPoolClientId;
        this.mcpClientId = mcpClient.userPoolClientId;
        this.domainUrl = domain.baseUrl();
    }
}
