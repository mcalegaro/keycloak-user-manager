import { NextApiRequest } from 'next';
import { kcCfg, kcRoles } from '../../components/keycloak.config';
// import logger from '../../server/logger/logger';
import TokenService from '../../server/token/tokenService';

// import { unstable_getServerSession } from "next-auth/next"
// import { authOptions } from "./auth/[...nextauth]"

// const handler = nextConnect()
// handler.use(apiWithAuth)
// handler.get(apiWithAuth, async (req, res) => usersApi(req, res))
// export default handler

const usersApi = async (req: NextApiRequest, res) => {

    const { query, method, headers } = req;

    // const session = await unstable_getServerSession(req, res, authOptions)

    const valid = await TokenService.authorize(headers['authorization'], kcRoles.userRole);
    if (!valid) {
        console.error(`${method} - ${query}`);
        res.status(401).json('Access denied.')
        return
    }

    const accessToken = await TokenService.token();

    switch (method) {
        case 'GET':
            await listUsers(req, res, accessToken);
            break;
        default:
            console.warn(`${method} - ${query}`);
            res.status(404).json('Not found.')
            break;
    }

}

export default usersApi

async function listUsers(req, res, accessToken) {

    const { query, method, } = req;

    const data = await fetch(
        kcCfg.url + '/admin/realms/' +
        kcCfg.realm + '/users?' +
        Object.keys(query)[0] + '=' + Object.values(query)[0],
        {
            method: method,
            headers: { Authorization: "Bearer " + accessToken }
        })
        .then((res) => res.json())
        .then((data) => {
            res.status(200).json(data);
        }).catch((e) => {
            console.error(e.message);
            res.status(500).json(e.message)
        });

}

