import { NextApiRequest } from 'next';
import { kcCfg, kcRoles } from '../../../../components/keycloak.config';
import TokenService from '../../../../server/token/tokenService';

const groupMembersApi = async (req: NextApiRequest, res) => {

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

export default groupMembersApi

async function listMembers(req, res, accessToken) {

    const { query, method, } = req;
    let uri = kcCfg.url + '/admin/realms/' + kcCfg.realm + '/groups/' + query['id'] + '/members?'
        + 'briefRepresentation=true';

    Object.keys(query).forEach((element, i) => {
        uri = uri + '&' + Object.keys(query)[i] + '=' + Object.values(query)[i];
    });

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

