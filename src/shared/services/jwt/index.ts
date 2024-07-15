import { CognitoJwtVerifier } from 'aws-jwt-verify';

export const verifier = CognitoJwtVerifier.create({
    userPoolId: String(process.env.AWS_COGNITO_POOL_ID),
    clientId: String(process.env.AWS_COGNITO_CLIENT_ID),
    tokenUse: 'access',
});

export const decodeJwt = (jwt: string) => {
    return verifier.verify(jwt);
};
