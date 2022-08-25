import { debug } from "console";
import { isJwtExpired } from 'jwt-check-expiration';
import { kcCfg } from "../../components/keycloak.config";

const keycloakConfidential = {
    clientId: process.env.KC_CLIENT_ID,
    clientSecret: process.env.KC_CLIENT_SECRET
}

export default class TokenService {
    private static instance: string = null;
    public static async token(): Promise<string> {
        if (!this.instance || isJwtExpired(TokenService.instance)) {
            debug('[DEBUG] AccessToken renewed.');
            TokenService.instance = await this.getAccessToken();
        }
        return TokenService.instance;
    }
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