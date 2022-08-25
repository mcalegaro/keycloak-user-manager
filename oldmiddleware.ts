// middleware.ts

import { NextRequestWithAuth, withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { kcCfg, kcRoles } from "./components/keycloak.config";
import logger from "./server/logger/logger";
// import exp from 'jwt-check-expiration';

// // `withAuth` augments your `Request` with the user's token.
export default withAuth(

    // // This function can be marked `async` if using `await` inside
    // export default
    async function middleware(req: NextRequestWithAuth) {
        const { method, url, nextUrl: { pathname }, nextauth: { token: { accessToken } } } = req;
        try {
            const bearer: string = `Bearer ${accessToken}`;
            // info(bearer)
            const v = await verifyAccessToken(bearer)
            // info(v)
            if (pathname.startsWith('/api/users')) {
                return authorizeApiUsers(req)
            }
        } catch (err) {
            return deny(method, pathname, url);
        }
    }
    , {
        callbacks: {
            authorized: ({ req, token }) => {
                return !!token //&& !exp.isJwtExpired(token.accessToken)
            }
        }
    }
)

export const config = { matcher: ["/api/:path*"] }

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

function authorizeApiUsers(req: NextRequestWithAuth) {
    const { method, nextUrl: { pathname }, url, nextauth: { token: { accessToken } } } = req
    if (method === 'PUT') {
        return authorize(req, accessToken, kcRoles.adminRole)
    } else if (method === 'GET') {
        return authorize(req, accessToken, kcRoles.userRole)
    }
}

function authorize(req: NextRequestWithAuth, accessToken: any, roleToAllow: string) {
    const { method, nextUrl: { pathname }, url } = req;
    const parsed: any = parseJwt(accessToken);
    info(`Authorizing ${method} - ${pathname}`)
    if (!parsed) {
        return deny(method, pathname, url);
    }
    const hasRole = parsed.resource_access[kcCfg.clientId].roles.includes(roleToAllow)
    if (!hasRole) {
        return deny(method, pathname, url)
    } else {
        info(`allowed ${method} ${pathname}`);
    }
}
function deny(method, pathname, url) {
    info(`denied ${method} ${pathname}`);
    const redir = new URL('/api/apiDenied/', url)
    redir.searchParams.set('from', pathname)
    info('redirecting')
    return NextResponse.rewrite(redir)
}

export async function verifyAccessToken(bearerToken: string) {
    info('verifying access token...');
    const res = await fetch(`${kcCfg.url}/realms/${kcCfg.realm}/protocol/openid-connect/userinfo`, {
        headers: {
            Authorization: bearerToken
        }
    })
    if (res.status !== 200) {
        throw await res.json()
    } else {
        info('acessToken ok');
        return await res.json()
    }
}

function info(msg) {
    //     logger.info(JSON.stringify({
    //         "level": 30,
    //         "time": new Date(),
    //         "pid": 11111,
    //         "hostname": "middleware",
    //         "msg": JSON.stringify({ from: 'mw', msg: msg })
    //     })) //json like pino
    logger.info(msg);
}

