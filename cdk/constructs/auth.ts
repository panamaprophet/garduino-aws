import { Construct } from 'constructs';
import { CfnOutput, Duration, Stack } from 'aws-cdk-lib';
import { OAuthScope, UserPool, UserPoolClientIdentityProvider } from 'aws-cdk-lib/aws-cognito';

const MCP_CALLBACK_URL = 'http://localhost:8765/callback';

export class Auth extends Construct {
    readonly userPoolId: string;
    readonly webClientId: string;
    readonly mcpClientId: string;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const { stackName } = Stack.of(this);

        const userPoolId = process.env.USER_POOL_ID;
        const webClientId = process.env.USER_POOL_CLIENT_ID;

        if (!userPoolId || !webClientId) {
            throw new Error('Missing user pool configuration in environment variables');
        }

        const userPool = UserPool.fromUserPoolId(this, 'user-pool', userPoolId);

        const mcpClient = userPool.addClient('mcp-client', {
            userPoolClientName: `${stackName}-mcp`,
            generateSecret: false,
            oAuth: {
                flows: { authorizationCodeGrant: true },
                scopes: [OAuthScope.OPENID],
                callbackUrls: [MCP_CALLBACK_URL],
            },
            supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
            preventUserExistenceErrors: true,
            enableTokenRevocation: true,
            accessTokenValidity: Duration.hours(1),
            refreshTokenValidity: Duration.days(30),
        });

        this.userPoolId = userPoolId;
        this.webClientId = webClientId;
        this.mcpClientId = mcpClient.userPoolClientId;

        new CfnOutput(this, 'McpClientId', { value: this.mcpClientId });
    }
}
