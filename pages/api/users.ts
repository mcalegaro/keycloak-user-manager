// import nextConnect from 'next-connect';
import nextConnect from 'next-connect';
import apiWithAuth from '../../components/apiWithAuth';
import { kcCfg } from '../../components/keycloak.config';
import logger from '../../server/logger/logger';
import TokenService from '../../server/token/tokenService';

// const handler = nextConnect()
// handler.use(apiWithAuth)
// handler.get(apiWithAuth, async (req, res) => usersApi(req, res))
// export default handler

const usersApi = async (req, res) => {

    const { query, method } = req;

    const accessToken = await TokenService.token();

    switch (method) {
        case 'GET':
            await listUsers(req, res, accessToken);
            break;
        default:
            logger.debug(`${method} - ${query}`);
            res.status(404).json({})
            break;
    }
}

async function listUsers(req, res, accessToken) {

    const { query: { username }, method, } = req;

    const data = await fetch(kcCfg.url + '/admin/realms/' + kcCfg.realm + '/users?username=' + username,
        {
            method: method,
            headers: { Authorization: "Bearer " + accessToken }
        })
        .then((res) => res.json())
        .then((data) => {
            res.status(200).json(data);
        }).catch((err) => {
            logger.error(err);
            res.status(500).json(err)
        });

}


export default usersApi