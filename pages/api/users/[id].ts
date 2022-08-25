import nextConnect from "next-connect";
import apiWithAuth, { authorize } from "../../../components/apiWithAuth";
import { kcCfg, kcRoles } from "../../../components/keycloak.config";
import logger from "../../../server/logger/logger";
import TokenService from "../../../server/token/tokenService";

// const handlerUserApi = nextConnect()
// handlerUserApi.use(apiWithAuth)
// handlerUserApi.get(apiWithAuth, async (req, res) => userApi(req, res))
// export default handlerUserApi

const userApi = async (req, res) => {
    await authorize(req, res, null, kcRoles.adminRole);
    if (res.statusCode !== 200) {
        return;
    }
    
    const { query, method } = req;
    const accessToken = await TokenService.token();

    switch (method) {
        case 'PUT':
            await updateUser(req, res, accessToken);
            break;
        default:
            logger.debug(`${method} - ${query}`);
            res.status(404).json({})
            break;
    }
}

export default userApi

async function updateUser(req, res, accessToken) {
    const { query: { id }, method, body } = req;
    const strBody = JSON.stringify(body)
    const uri = kcCfg.url + '/admin/realms/' + kcCfg.realm + '/users/' + id;
    logger.info(`uri ${uri}`)
    logger.info(`at ${accessToken}`)
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
            logger.error(e);
            res.status(500).json(e.message)
        });
}