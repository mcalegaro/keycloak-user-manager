import { decode, verify } from 'jsonwebtoken';
import { NextRequest } from "next/server";
import { kcCfg, kcRoles } from "./keycloak.config";
// import logger from "../server/logger/logger";
import axios from 'axios';
import { getKey } from '../pages/api/auth/[...nextauth]';
import { verifyAccessToken, verifyAccessToken2 } from '../oldmiddleware';

export default async (req: NextRequest, res
    , next
) => {
    // logger.info(req)
    if (req.url.startsWith('/api/users')) {
        await authorizeUsers(req, res, next);
    } else {
        next();
    }
};

async function authorizeUsers(req: NextRequest, res, next) {
    const { method } = req;

    switch (method) {
        case 'GET':
            await authorize(req, res, next, kcRoles.userRole)
            break;
        case 'PUT':
            await authorize(req, res, next, kcRoles.adminRole)
            break;
        default:
            await deny(res)
            break;
    }
}

export async function authorize2(req: NextRequest, res, session,
    roleToAllow) {
    try {
        const { method, url } = req;
        const bearer = session.token['accessToken'];
        if (!bearer) {
            throw { message: 'missing auth token' }
        }

        await verifyAccessToken2(bearer)

        const at = decode(bearer, { complete: true })
        if (at.payload.resource_access[kcCfg.clientId].roles.includes(roleToAllow)) {
            console.info(`${method} ${url} allowed`)
            return
        }
    } catch (err) {
        console.error(err)
    }
    await deny(res)
}

export async function authorize(req: NextRequest, res,
    next,
    roleToAllow) {
    try {
        const { method, url } = req;
        const bearer = req.headers['authorization'];
        if (!bearer) {
            throw { message: 'missing auth token' }
        }

        await verifyAccessToken(bearer)

        const at = decode(bearer.replace('Bearer ', ''), { complete: true })
        if (at.payload.resource_access[kcCfg.clientId].roles.includes(roleToAllow)) {
            console.info(`${method} ${url} allowed`)
            // next();
            return
        }
    } catch (err) {
        console.error(err)
    }
    await deny(res)
}

const deny = (res) => {
    console.warn('denied')
    res.status(401).json({ message: "Access denied." });
}