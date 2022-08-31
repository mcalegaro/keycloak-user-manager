import { useSession } from 'next-auth/react';
import Head from "next/head";
import { useEffect, useState } from "react";
import { Button, Col, Container, Form, ListGroup, ListGroupItem, Row, Stack } from 'react-bootstrap';
import Layout from "../../../components/layout/layout";
import Loading from '../../../components/loading/loading';
import MsgToast from '../../../components/toast';
// import logger from '../../../server/logger/logger';


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
    const USERS_MIN_LENGTH = 6;
    let UPDATE_SUGGESTIONS = undefined;
    try {
        UPDATE_SUGGESTIONS =
            JSON.parse(process.env.NEXT_PUBLIC_UPDATE_SUGGESTIONS);
    } catch (error) {
        console.warn('Failed on read UPDATE_SUGGESTIONS.')
    }

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
        const us = ev.target.value.replaceAll('\n', ',').replaceAll(' ', '').replaceAll(',,', ',').split(',');
        setUsers(us)
        setUsersValid(us.findIndex(u => u.length >= USERS_MIN_LENGTH) >= 0);
    };

    const handleSelect = (ev) => {
        try {
            let values = JSON.parse(keyValue);
            const addVal = JSON.parse(ev.target.value)
            values[`${Object.keys(addVal)[0]}`] = Object.values(addVal)[0]
            setKeyValue(JSON.stringify(values))
        } catch (e) {
            handleChangeKeyValue(ev);
        }
    }

    const handleChangeKeyValue = (ev) => {
        setKeyValue(ev.target.value);
        try {
            JSON.parse(ev.target.value);
            setJsonValid(true)
        } catch (e) {
            setJsonValid(false)
        }
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
        return await fetch('/api/users?username=' + u, {
            method: 'GET', headers: {
                Authorization: "Bearer " + session.token['accessToken']
            }
        }).then(async (res) => {
            if (res.status === 200) {
                return res.json();
            } else {
                throw await res.json().then((data) => {
                    return { message: data }
                })
            }
        }).then((data) => {
            return data
        });
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
                Authorization: "Bearer " + session.token['accessToken']
            },
            body: JSON.stringify(u)
        }).then(async (res) => {
            if (res.status === 200) return res.json()
            else throw await res.json().then((data) => { return data })
        })
            .then((data) => {
                return data;
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
            return false;
        }

        try {
            JSON.parse(keyValue)
        } catch (e) {
            document.getElementById('keyValInput').focus()
            return false;
        }

        setLastUpdate(new Map());
        users.filter(u => u.length >= USERS_MIN_LENGTH).forEach(async (u) => {
            await notifyUserStatus(u, PROCESSING);
            const processUser = async (u) => {
                try {
                    const userRead = await readUser(u);
                    if (userRead.length > 0) {
                        const userUpdate = await setAttributes(userRead[0])
                        const updated = await updateUser(userUpdate);
                        await notifyUserStatus(u, JSON.stringify(updated));
                    } else {
                        await notifyUserStatus(u, 'not found.');
                    }
                } catch (e) {
                    await (notifyUserStatus(u, JSON.stringify(e.message)))
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
                        <Form.Group className="mb-3" >
                            <Form.Group as={Row} >
                                <Col >
                                    <Form.Label>User names</Form.Label>
                                </Col>
                                <Col style={{ textAlign: 'right' }}>
                                    <Button onClick={clearUserNames} variant="secondary" size="sm">Clear</Button>
                                </Col>
                            </Form.Group>
                            <Form.Control autoFocus as="textarea" id="users"
                                placeholder="User names"
                                value={users}
                                onChange={handleChangeUsers}
                                required minLength={USERS_MIN_LENGTH}
                                rows={4}
                            />
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
                        </Form.Group>
                        <Form.Group className="mb-3" >
                            <Form.Group as={Row}>
                                <Col >
                                    <Form.Label>Add Attributes</Form.Label>
                                </Col>
                                <Col style={{ textAlign: 'right' }}>
                                    <Button onClick={clearAttributes} variant="secondary" size="sm">Clear</Button>
                                </Col>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                {/* <Col sm="11"> */}
                                <Form.Select onChange={handleSelect} >
                                    <option value=""></option>
                                    {!!UPDATE_SUGGESTIONS
                                        ? UPDATE_SUGGESTIONS.map(s => {
                                            return <option key={Object.keys(s)[0]} value={JSON.stringify(s)}>{Object.keys(s)[0]}</option>
                                        })
                                        : <option value='{"usuario-espelho":["usuario-espelho-admin","usuario-espelho-padrao"]}'>usuario-espelho</option>
                                    }
                                </Form.Select>
                                {/* </Col> */}
                                {/* <Col sm="11"> */}
                                <Form.Control as="textarea" id="keyValInput"
                                    placeholder='Add Attributes'
                                    onChange={handleChangeKeyValue} value={keyValue}
                                    required rows={5}
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
                                {/* </Col> */}
                            </Form.Group>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <div className="d-grid gap-2">
                                <Button type='submit' >Update</Button>
                                {/* <Button variant="primary" size="lg">
                                    Block level button
                                </Button>
                                <Button variant="secondary" size="lg">
                                    Block level button
                                </Button> */}
                            </div>
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
                                    : Array.from(lastUpdate.keys()).map((k, i) => {
                                        return <ListGroupItem key={k} variant={i % 2 == 1 ? 'dark' : ''}>
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