// import nextConnect from "next-connect";
// import apiWithAuth, { authorize, authorize2 } from "../../../components/apiWithAuth";
import { NextApiRequest } from "next";
import { kcCfg, kcRoles } from "../../../components/keycloak.config";
// import logger from "../../../server/logger/logger";
import TokenService from "../../../server/token/tokenService";

// import { unstable_getServerSession } from "next-auth/next"
// import { authOptions } from "../auth/[...nextauth]"

// const handlerUserApi = nextConnect()
// handlerUserApi.use(apiWithAuth)
// handlerUserApi.get(apiWithAuth, async (req, res) => userApi(req, res))
// export default handlerUserApi

const userApi = async (req: NextApiRequest, res) => {

    const { query, method, headers } = req;

    // const session = await unstable_getServerSession(req, res, authOptions)

    const valid = await TokenService.authorize(headers['authorization'], kcRoles.adminRole);
    if (!valid) {
        console.error(`${method} - ${query}`);
        res.status(401).json('Access denied.')
        return
    }

    const accessToken = await TokenService.token();

    switch (method) {
        case 'PUT':
            await updateUser(req, res, accessToken);
            break;
        default:
            console.debug(`${method} - ${query}`);
            res.status(404).json('Not found.')
            break;
    }
}

export default userApi

async function updateUser(req, res, accessToken) {
    const { query: { id }, method, body } = req;
    const strBody = JSON.stringify(body)
    const uri = kcCfg.url + '/admin/realms/' + kcCfg.realm + '/users/' + id;
    const data = await fetch(uri,
        {
            method: method,
            headers: { Authorization: "Bearer " + accessToken, 'Content-Type': 'application/json' },
            body: body
        })
        .then((res) => {
            return 'success';
        })
        .then((data) => {
            res.status(200).json(data);
        }).catch((e) => {
            console.error(e);
            res.status(500).json(e.message)
        });
}