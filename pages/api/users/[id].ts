import { kcCfg } from "../../../components/keycloak.config";
import logger from "../../../server/logger/logger";
import TokenService from "../../../server/token/tokenService";

const userApi = async (req, res) => {
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
    const data = await fetch(kcCfg.url + '/admin/realms/' + kcCfg.realm + '/users/' + id,
        {
            method: method,
            headers: { Authorization: "Bearer " + accessToken, 'Content-Type': 'application/json' },
            body: body
        })
        .then((res) => {
            return { msg: 'success' };
        })
        .then((data) => {
            res.status(200).json(data);
        }).catch((err) => {
            logger.error(err);
            res.status(500).json(err)
        });
}