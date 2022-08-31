import { NextApiRequest } from 'next';
import { kcCfg, kcRoles } from '../../../../components/keycloak.config';
import TokenService from '../../../../server/token/tokenService';

const userGroupsApi = async (req: NextApiRequest, res) => {

    const { query, method, headers } = req;

    const valid = await TokenService.authorize(headers['authorization'], kcRoles.userRole);
    if (!valid) {
        console.error(`${method} - ${query}`);
        res.status(401).json('Access denied.')
        return
    }

    const accessToken = await TokenService.token();

    switch (method) {
        case 'GET':
            await listGroups(req, res, accessToken);
            break;
        default:
            console.warn(`${method} - ${query}`);
            res.status(404).json('Not found.')
            break;
    }

}

export default userGroupsApi

async function listGroups(req, res, accessToken) {

    const { query: { id }, method, body } = req;
    const uri = kcCfg.url + '/admin/realms/' + kcCfg.realm + '/users/' + id + '/groups';
    const data = await fetch(uri, {
        method: method, headers: { Authorization: "Bearer " + accessToken }
    })
        .then((data) => data.json().then(body => {
            res.status(data.status).json(body)
        }))
        .catch((e) => {
            console.error(e.message);
            res.status(500).json(e)
        });

}

