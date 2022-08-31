import { useSession } from 'next-auth/react';
import Head from "next/head";
import { useEffect, useState } from "react";
import { Badge, Button, ButtonGroup, CloseButton, Col, Container, Form, ListGroup, ListGroupItem, Row, Spinner, Stack, ToggleButton } from 'react-bootstrap';
import Layout from "../../../components/layout/layout";
import Loading from '../../../components/loading/loading';
import MsgToast from '../../../components/toast';
// import logger from '../../../server/logger/logger';


function UpdatePage() {

    const { data: session, status } = useSession();
    const [adminRole, setAdminRole] = useState();
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState(null);
    const [newGroups, setNewGroups] = useState(new Map<number, any>());
    const [lastUpdate, setLastUpdate] = useState(new Map());
    const [groupsValid, setGroupsValid] = useState(false);
    const [usersValid, setUsersValid] = useState(false);
    const [refreshUpdate, setRefreshUpdate] = useState(true);
    const [groupSelectValue, setGroupSelectValue] = useState('');

    const [radioValue, setRadioValue] = useState('A');

    const deleteOption = 'D';
    const radios = [
        { name: '+Add', value: 'A' },
        { name: '-Delete', value: deleteOption }
    ];

    const PROCESSING = 'processing';
    const USERS_MIN_LENGTH = 6;

    useEffect(() => {
        if (status === 'authenticated' && adminRole === undefined) {
            setAdminRole(session['token']['hasAdminRole']);
            const fetchGroups = async () => {
                setGroups(
                    await fetch('/api/groups', {
                        method: 'GET', headers: {
                            Authorization: "Bearer " + session.token['accessToken']
                        }
                    }).then(d => d.json()).then(d => d)
                )
            }
            fetchGroups();
        }
    }, [status, users, lastUpdate, refreshUpdate, groupsValid, usersValid, newGroups])

    const handleChangeUsers = (e) => {
        const us = e.target.value.replaceAll('\n', ',').replaceAll(' ', '').replaceAll(',,', ',').split(',');
        setUsers(us)
        setUsersValid(us.findIndex(u => u.length >= USERS_MIN_LENGTH) >= 0);
    };

    const handleSelect = async (e) => {
        const idx: number = e.target.value
        if (!!idx) {
            const g = groups[idx];
            await setNewGroups((nG) => nG.set(g.id, g));
            setGroupsValid(newGroups.size > 0);
            setRefreshUpdate(d => !d)
        }
    }

    const clearUserNames = (e) => {
        setUsers([]);
    }

    const clearNewGroups = (e) => {
        setNewGroups(new Map())
        setGroupSelectValue('');
        setGroupsValid(false);
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

    const notifyUserStatus = async (userName, status) => {
        const user = new Map().set(userName, status);
        await setLastUpdate(data => data.set(userName, status));
        await setRefreshUpdate(d => !d);
    }

    const updateUser = async (uId, gId, option) => {
        let m = 'PUT';
        if (option === deleteOption) {
            m = 'DELETE'
        }
        const resp: any = await fetch('/api/users/' + uId + '/groups/' + gId, {
            method: m, headers: {
                Authorization: "Bearer " + session.token['accessToken']
            }
        }).then(async (res) => {
            if (res.status === 204) return true
            else throw await res.json().then((data) => { return data })
        })
            .then((data) => {
                return data;
            });
        return resp;
    }

    const delGroup = (e) => {
        const idx = e.target.value;
        const ng = newGroups;
        ng.delete(idx);
        setNewGroups(ng);
        setGroupsValid(newGroups.size > 0);
        setRefreshUpdate(d => !d);
    }

    //////////////////////////////////////////////////////
    const fetchUserGroups = async (uId) => {
        return fetch('/api/users/' + uId + '/groups', { headers: { Authorization: 'Bearer ' + session.token['accessToken'] } })
            .then(async (d) => {
                if (d.status === 200) {
                    return await d.json().then((d) => {
                        return d;
                    })
                } else {
                    throw { error: d.json() }
                }
            }).catch((error) => {
                console.error('error:', JSON.stringify(error))
                return error;
            });
    }
    const update = async (event) => {
        event.preventDefault();

        if (!usersValid) {
            document.getElementById('users').focus()
            return false;
        }

        if (!groupsValid) {
            document.getElementById('groupsSelect').focus()
            return false;
        }

        setLastUpdate(new Map());
        users.filter(u => u.length >= USERS_MIN_LENGTH).forEach(async (u) => {
            await notifyUserStatus(u, PROCESSING);
            const processUser = async (u) => {
                try {
                    const userRead = await readUser(u);
                    if (userRead.length > 0) {
                        const user = userRead[0];
                        const userGroups = await fetchUserGroups(user.id);
                        for (const g of Array.from(newGroups.keys())) {
                            const updated = await updateUser(user.id, g, radioValue);
                            // await notifyUserStatus(u, JSON.stringify(updated ? "Success" : "Error"));
                        }
                        await notifyUserStatus(u, JSON.stringify((await fetchUserGroups(user.id)).map(g=>g.path),null,' '));
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
                                    <Form.Label>Groups</Form.Label>
                                </Col>
                                <Col style={{ textAlign: 'right' }}>
                                    <Button onClick={clearNewGroups} variant="secondary" size="sm">Clear</Button>
                                </Col>
                            </Form.Group>
                            <Form.Group className="mb-3" >
                                <Form.Select onChange={handleSelect} value={groupSelectValue} id="groupsSelect">
                                    <option value=""></option>
                                    {!!groups
                                        ? groups.map((g, i) => {
                                            return <option key={i} value={i}>{`${g.id} - ${g.path}`}</option>
                                        })
                                        : <></>
                                    }
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <ListGroup >
                                    <ListGroupItem>
                                        <b>Selected Groups to </b>
                                        <ButtonGroup>
                                            {radios.map((radio, idx) => (
                                                <ToggleButton
                                                    key={idx}
                                                    id={`radio-${idx}`}
                                                    type="radio"
                                                    variant={idx % 2 ? 'outline-danger' : 'outline-success'}
                                                    name="radio"
                                                    value={radio.value}
                                                    checked={radioValue === radio.value}
                                                    onChange={(e) => setRadioValue(e.currentTarget.value)}
                                                >
                                                    {radio.name}
                                                </ToggleButton>
                                            ))}
                                        </ButtonGroup>
                                    </ListGroupItem>
                                    {
                                        newGroups.size > 0
                                            ? Array.from(newGroups.values()).map((g, i) =>
                                                <ListGroupItem key={i}>
                                                    <Form.Group as={Row}>
                                                        <Col>
                                                            {/* <Badge bg='primary'> */}
                                                            <pre style={{ margin: '0' }}>
                                                                <CloseButton onClick={delGroup} value={g.id}></CloseButton>&nbsp;
                                                                <b>{g.id}</b> - {g.path}
                                                            </pre>
                                                            {/* </Badge> */}
                                                        </Col>
                                                        <Col>
                                                        </Col>
                                                    </Form.Group>
                                                </ListGroupItem>
                                            )
                                            : <></>
                                    }
                                </ListGroup>
                            </Form.Group>
                            <Form.Group>
                                {!groupsValid ?
                                    <div style={{
                                        // display: 'block !important',
                                        width: '100%',
                                        marginTop: '0.25rem',
                                        fontSize: '.875em',
                                        color: '#dc3545'
                                    }} //className='invalid-feedback'
                                    >
                                        Please provide a valid group.
                                    </div>
                                    : <Form.Control.Feedback type="invalid">
                                        Please provide a valid group.
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
                                            {k} - {lastUpdate.get(k) === PROCESSING ? <Spinner animation='grow' size='sm' /> : lastUpdate.get(k)}
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