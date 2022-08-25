import NextAuth, { NextAuthOptions } from "next-auth"
import KeycloakProvider from 'next-auth/providers/keycloak'
import { kcCfg, kcRoles } from '../../../components/keycloak.config'
import logger from "../../../server/logger/logger"
import jwt from 'jsonwebtoken'
import { signOut } from "next-auth/react"
import { verifyAccessToken } from "../../../oldmiddleware"

export const authOptions: NextAuthOptions = {
    // Configure one or more authentication providers
    providers: [
        KeycloakProvider({
            clientId: kcCfg.clientId,
            clientSecret: kcCfg.clientSecret,
            issuer: `${kcCfg.url}/realms/${kcCfg.realm}`
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    // session: {
    //     maxAge: 10 * 60
    // },
    callbacks: {
        async jwt({ token, account }) {
            // Persist the OAuth access_token to the token right after signin
            if (account) {
                logger.info('reading account.')
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
                const parsed = jwt.decode(token.accessToken, { complete: true });
                const resAccess = parsed.payload['resource_access'][kcCfg.clientId];
                token.hasUserRole = resAccess !== undefined && resAccess.roles.includes(kcRoles.userRole)
                token.hasAdminRole = resAccess !== undefined && resAccess.roles.includes(kcRoles.adminRole)
            }
            return token
        },
        async session({ session, token, user }) {
            logger.info('validating session.')

            try {
                session.token = token;
                const bearerToken = `Bearer ${token.accessToken}`;
                const info = await verifyAccessToken(bearerToken)
                // jwt.verify(token.accessToken, await getKey(token.parsed['header'].kid), { algorithms: [token.parsed['header'].alg] })
            } catch (err) {
                logger.error(JSON.stringify(err))
                session.expired = true
            }
            return session
        }
    }

}

export default NextAuth(authOptions)

export async function getKey(kid: string) {
    const url: string = `${kcCfg.url}/realms/${kcCfg.realm}/protocol/openid-connect/certs`;
    const certs: any = await fetch(url).then(r => r.json()).then(d => d);
    const c = certs.keys.filter(c => c.kid === kid);
    return `-----BEGIN CERTIFICATE-----\n${c[0].x5c[0]}\n-----END CERTIFICATE-----`;
}
