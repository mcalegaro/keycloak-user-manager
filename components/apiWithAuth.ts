import { decode, verify } from 'jsonwebtoken';
import { NextRequest } from "next/server";
import { kcCfg, kcRoles } from "./keycloak.config";
import logger from "../server/logger/logger";
import axios from 'axios';
import { getKey } from '../pages/api/auth/[...nextauth]';
import { verifyAccessToken } from '../middleware';

export default async (req: NextRequest, res
    , next
) => {
    // logger.info(req)
    if (req.url.startsWith('/api/users')) {
        await authorizeUsers(req, res
            , next
        );
    } else {
        next();
    }
};

async function authorizeUsers(req: NextRequest, res
    , next
) {
    if ('GET' === req.method) {
        await authorize(req, res,
            next,
            kcRoles.userRole)
    }
}

async function authorize(req: NextRequest, res,
    next,
    roleToAllow) {
    try {
        const { method, url } = req;
        const bearer = req.headers['authorization'];
        if (!bearer) {
            throw { message: 'missing auth token' }
        }

        verifyAccessToken(bearer)

        const at = decode(bearer.replace('Bearer ', ''), { complete: true })
        // const v = verify(bearer.replace('Bearer ', ''), await getKey(at.header.kid), { algorithms: [at.header.alg] });
        // logger.info(v)
        if (at.payload.resource_access[kcCfg.clientId].roles.includes(roleToAllow)) {
            logger.info(`${method} ${url} allowed`)
            next();
            return
        }
    } catch (err) {
        logger.error(err)
    }
    logger.warn('denied')
    res.status(401).json({ message: "Access denied." });
}
