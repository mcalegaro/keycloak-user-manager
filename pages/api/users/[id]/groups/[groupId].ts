import { NextApiRequest } from 'next';
import { kcCfg, kcRoles } from '../../../../../components/keycloak.config';
import TokenService from '../../../../../server/token/tokenService';

const userGroupApi = async (req: NextApiRequest, res) => {

    const { query, method, headers } = req;

    const valid = await TokenService.authorize(headers['authorization'], kcRoles.adminRole);
    if (!valid) {
        console.error(`${method} - ${query}`);
        res.status(401).json('Access denied.')
        return
    }

    const accessToken = await TokenService.token();

    switch (method) {
        case 'PUT':
        case 'DELETE':
            await updateGroup(req, res, accessToken);
            break;
        default:
            console.warn(`${method} - ${query}`);
            res.status(404).json('Not found.')
            break;
    }

}

export default userGroupApi

async function updateGroup(req, res, accessToken) {

    const { query: { id, groupId }, method, body } = req;
    const uri = kcCfg.url + '/admin/realms/' + kcCfg.realm + '/users/' + id + '/groups/' + groupId;
    const data = await fetch(uri, {
        method: method, headers: { Authorization: "Bearer " + accessToken }, body: body
    })
        .then((data) => (
            res.status(data.status).json(data.status === 204 ? 'Success' : data.json())
        ))
        .catch((e) => {
            console.error(e.message);
            res.status(500).json(e)
        });

}

