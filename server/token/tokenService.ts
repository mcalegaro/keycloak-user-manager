import { debug } from "console";
import { isJwtExpired } from 'jwt-check-expiration';
import { kcCfg } from "../../components/keycloak.config";
// import logger from "../logger/logger";
import jwt from 'jsonwebtoken';

const keycloakConfidential = {
    clientId: process.env.KC_CLIENT_ID,
    clientSecret: process.env.KC_CLIENT_SECRET
}

export default class TokenService {
    private static instance: string = null;
    public static async token(): Promise<string> {
        if (!this.instance || isJwtExpired(TokenService.instance)) {
            console.debug('AccessToken renewed.');
            TokenService.instance = await this.getAccessToken();
        }
        return TokenService.instance;
    }

    public static async authorize(bearerToken: string, roleToAllow) {
        console.debug('verifying access token...');
        const res = await fetch(`${kcCfg.url}/realms/${kcCfg.realm}/protocol/openid-connect/userinfo`, {
            headers: {
                Authorization: bearerToken
            }
        })

        if (res.status !== 200) {
            console.error(res.status)
            return false;
        } else {
            const parsed = this.parseJwt(bearerToken)
            if (!parsed.resource_access[kcCfg.clientId].roles.includes(roleToAllow)) {
                return false;
            }
            console.debug('acessToken ok');
            return true;
        }
    }

    private static parseJwt(token) {
        return jwt.decode(token.replace('Bearer ', ''))
    };

    private static async getAccessToken(): Promise<string> {
        const details = {
            client_id: keycloakConfidential.clientId,
            client_secret: keycloakConfidential.clientSecret,
            grant_type: 'client_credentials',
        };

        const formBody = [];
        for (let property in details) {
            const encodedKey = encodeURIComponent(property);
            const encodedValue = encodeURIComponent(details[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }

        const body = formBody.join("&");

        return await fetch(
            kcCfg.url + '/realms/' + kcCfg.realm + '/protocol/openid-connect/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        })
            .then((data) => data.json())
            .then((json) => json.access_token)

    }
}