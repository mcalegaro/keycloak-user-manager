import { NextApiRequest } from 'next';
import { kcCfg, kcRoles } from '../../../components/keycloak.config';
import TokenService from '../../../server/token/tokenService';

const groupApi = async (req: NextApiRequest, res) => {

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
            await listMembers(req, res, accessToken);
            break;
        default:
            console.warn(`${method} - ${query}`);
            res.status(404).json('Not found.')
            break;
    }

}

export default groupApi

async function listMembers(req, res, accessToken) {

    const { query, method, } = req;
    const uri = kcCfg.url + '/admin/realms/' + kcCfg.realm + '/groups/' + query['id'];
    const data = await fetch(uri, {
        method: method, headers: { Authorization: "Bearer " + accessToken }
    })
        .then((res) => res.json())
        .then((data) => {
            res.status(200).json(data);
        }).catch((e) => {
            console.error(e.message);
            res.status(500).json(e.message)
        });

}

