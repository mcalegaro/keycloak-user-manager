import { NextApiRequest } from 'next';
import { kcCfg, kcRoles } from '../../components/keycloak.config';
import TokenService from '../../server/token/tokenService';
// import logger from '../../server/logger/logger';

const groupsApi = async (req: NextApiRequest, res) => {

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

export default groupsApi

async function listGroups(req, res, accessToken) {

    const { query, method, } = req;

    const data = await fetch(
        kcCfg.url + '/admin/realms/' +
        kcCfg.realm + '/groups'
        // + '?' + Object.keys(query)[0] + '=' + Object.values(query)[0]
        ,
        {
            method: method,
            headers: { Authorization: "Bearer " + accessToken }
        })
        .then((res) => {
            if (res.status === 200) {
                return res.json()
            } else {
                throw { status: res.status, statusText: res.statusText }
            }
        })
        .then((data) => {
            const flat = []
            data.forEach(g => {
                flat.push(g);
                if (!!g.subGroups) {
                    g.subGroups.forEach(sg => { flat.push(sg) })
                }
            });
            res.status(200).json(flat);
        }).catch((e) => {
            console.error(e);
            res.status(500).json(e)
        });

}

