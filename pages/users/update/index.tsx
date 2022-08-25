import { useSession } from 'next-auth/react';
import Head from "next/head";
import { useEffect, useState } from "react";
import { Button, Col, Form, ListGroup, ListGroupItem, Row } from 'react-bootstrap';
import Layout from "../../../components/layout/layout";
import Loading from '../../../components/loading/loading';
import MsgToast from '../../../components/toast';
import logger from '../../../server/logger/logger';


function UpdatePage() {

    const [users, setUsers] = useState([]);
    const [keyValue, setKeyValue] = useState('');
    const [adminRole, setAdminRole] = useState();
    const { data: session, status } = useSession();
    const [lastUpdate, setLastUpdate] = useState(new Map());
    const [refreshUpdate, setRefreshUpdate] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const [validated, setValidated] = useState(false);
    const [jsonValid, setJsonValid] = useState(false);
    const [usersValid, setUsersValid] = useState(false);

    const PROCESSING = 'processing';
    const USERS_MIN_LENGTH = 5;

    const attrsIgnored = [
        "LDAP_ENTRY_DN",
        "LDAP_ID",
        "createTimestamp",
        "modifyTimestamp"];

    useEffect(() => {
        if (status === 'authenticated' && adminRole === undefined) {
            setAdminRole(session['token']['hasAdminRole']);
        }
    }, [status, users, keyValue, lastUpdate, refreshUpdate, errorMessage, validated, jsonValid, usersValid])

    const handleChangeUsers = (ev) => {
        const us = ev.target.value.replace('\n', ',').replace('\r', ',').replace(' ', '').replace(',,', ',').split(',');
        setUsers(us)
        setUsersValid(us.join().length > USERS_MIN_LENGTH);
    };

    const handleSelect = (ev) => {
        // document.getElementById('keyValInput').textContent = ev.target.value;
        // setKeyValue(ev.target.value);
        handleChangeKeyValue(ev);
    }

    const handleChangeKeyValue = (ev) => {
        setKeyValue(ev.target.value);
        try {
            JSON.parse(ev.target.value);
            setJsonValid(true)
        } catch (e) {
            setJsonValid(false)
        }
        logger.info(!!!keyValue || !jsonValid)
        logger.info(!!!keyValue)
        logger.info(!!!jsonValid)
    }

    const clearUserNames = (e) => {
        setUsers([]);
    }

    const clearAttributes = (e) => {
        setKeyValue('')
        // document.getElementById('keyValInput').textContent = null;
    }
    // //////////////////////////////////////////////

    const readUser = async (u) => {
        const resp: Array<any> = await fetch('/api/users?username=' + u, {
            method: 'GET', headers: {
                Authorization: "Bearer " + session.accessToken
            }
        }).then((res) => res.json())
            .then((data) => {
                return data
            }).catch((err) => {
                return undefined;
            });
        if (resp === undefined || resp.length == 0) {
            return undefined;
        } else {
            return resp[0];
        }
    }

    const setAttributes = async (user) => {
        const attributes = user['attributes']
        const newAttributes: Map<string, any> = new Map();
        if (attributes !== undefined) {
            const keys = Object.keys(attributes);
            await keys
                .filter(k => !attrsIgnored.includes(k))
                .forEach(k => {
                    newAttributes.set(k, attributes[k]);
                })
        }


        const toAdd = JSON.parse(keyValue)
        const keys = Object.keys(toAdd);
        await keys.forEach(k => {
            newAttributes.set(k, toAdd[k]);
        })

        // user['attributes'] = Object.fromEntries(newAttributes);
        const userAndAttrs = { id: user.id, attributes: Object.fromEntries(newAttributes) }
        return userAndAttrs;
    }

    const notifyUserStatus = async (userName, status) => {
        const user = new Map().set(userName, status);
        await setLastUpdate(data => data.set(userName, status));
        await setRefreshUpdate(d => !d);
    }

    const updateUser = async (u) => {
        const resp: any = await fetch('/api/users/' + u.id, {
            method: 'PUT', headers: {
                Authorization: "Bearer " + session.accessToken
            },
            body: JSON.stringify(u)
        }).then((res) => {
            return res.json();
        })
            .then((data) => {
                return data;
            }).catch((e) => {
                logger.error(e.message);
                return e.message;
            });
        return resp;
    }

    //////////////////////////////////////////////////////
    const update = async (event) => {
        event.preventDefault();
        // setShowError(false);
        // event.stopPropagation();

        // const form = event.currentTarget;
        // if (form.checkValidity() === false) {
        //     setValidated(true);
        //     document.querySelector('.form-control:invalid')['focus']();
        //     return false;
        // }

        if (!usersValid) {
            document.getElementById('users').focus()
        }
        // logger
        // document.getElementById('users').textContent

        try {
            JSON.parse(keyValue)
        } catch (e) {
            // setErrorMessage(e.message)
            document.getElementById('keyValInput').focus()
            // setShowError(true);
            return false;
        }

        setLastUpdate(new Map());
        users.filter(u => u.length > USERS_MIN_LENGTH).forEach(async (u) => {
            await notifyUserStatus(u, PROCESSING);
            const processUser = async (u) => {
                const userRead = await readUser(u);
                if (userRead !== undefined) {
                    const userUpdate = await setAttributes(userRead)
                    const updated = await updateUser(userUpdate);
                    await notifyUserStatus(u, updated);
                } else {
                    await notifyUserStatus(u, 'not found.');
                }
            }
            processUser(u);
        })
        return false;
    }

    return <>
        <Layout adminsOnly={true}>
            <Head>
                <title>Users Manager - Update Users</title>
            </Head>
            <h4>Update Users</h4>
            {status === 'loading' ? <Loading />
                : //adminRole ?
                <>
                    <Form
                        // noValidate validated={validated}
                        onSubmit={update}
                    >
                        <Form.Group className="mb-3" controlId="formUpdateUser">
                            <Form.Label>User names</Form.Label>
                            <Form.Group as={Row} className="mb-3">
                                <Col sm="11">
                                    <Form.Control autoFocus as="textarea" id="users"
                                        placeholder="User names"
                                        value={users}
                                        onChange={handleChangeUsers}
                                        required minLength={USERS_MIN_LENGTH} />
                                    {!!users && !usersValid ?
                                        <div style={{
                                            // display: 'block !important',
                                            width: '100%',
                                            marginTop: '0.25rem',
                                            fontSize: '.875em',
                                            color: '#dc3545'
                                        }} //className='invalid-feedback'
                                        >
                                            Please provide a valid user (at least {USERS_MIN_LENGTH} chars).
                                        </div>
                                        : <Form.Control.Feedback type="invalid">
                                            Please provide a valid json.
                                        </Form.Control.Feedback>
                                    }
                                </Col>
                                <Col sm="1">
                                    <Button onClick={clearUserNames}>Clear</Button>
                                </Col>
                            </Form.Group>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Add Attributes</Form.Label>
                            <Form.Group as={Row} className="mb-3">
                                <Col sm="11">
                                    <Form.Select onChange={handleSelect} >
                                        <option value=""></option>
                                        <option value='{"usuario-espelho":["usuario-espelho-admin","usuario-espelho-padrao"]}'>usuario-espelho</option>
                                    </Form.Select>
                                    <Form.Control as="textarea" id="keyValInput"
                                        placeholder='Add Attributes'
                                        onChange={handleChangeKeyValue} value={keyValue}
                                        required
                                    />
                                    {!!keyValue && !jsonValid ?
                                        <div style={{
                                            // display: 'block !important',
                                            width: '100%',
                                            marginTop: '0.25rem',
                                            fontSize: '.875em',
                                            color: '#dc3545'
                                        }} //className='invalid-feedback'
                                        >
                                            Please provide a valid json.
                                        </div>
                                        : <Form.Control.Feedback type="invalid">
                                            Please provide a valid json.
                                        </Form.Control.Feedback>
                                    }
                                </Col>
                                <Col sm="1">
                                    <Button onClick={clearAttributes}>Clear</Button>
                                </Col>
                            </Form.Group>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            {/* <Button onClick={update}>Update</Button> */}
                            <Button type='submit'>Update</Button>
                        </Form.Group>
                        {showError ?
                            <Form.Group className="mb-3">
                                <MsgToast title='Error' msg={errorMessage} showFunc={setShowError} />
                            </Form.Group>
                            : <></>}
                    </Form>

                    <div>
                        <>
                            <h5>Last Update</h5>
                            <ListGroup>
                                {lastUpdate.size === 0 ? <>
                                    <ListGroupItem>
                                        No results
                                    </ListGroupItem>
                                </>
                                    : Array.from(lastUpdate.keys()).map(k => {
                                        return <ListGroupItem key={k}>
                                            {k} - {lastUpdate.get(k) === PROCESSING ? <Loading /> : lastUpdate.get(k)}
                                        </ListGroupItem>
                                    })
                                }
                            </ListGroup>
                        </>
                    </div>
                </>
            }
        </Layout>
    </>;

}

export default UpdatePage