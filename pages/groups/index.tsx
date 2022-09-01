import { useSession } from 'next-auth/react';
import Head from "next/head";
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Col, Form, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import User from '../../components/fragments/user';
import Layout from "../../components/layout/layout";
import Loading from "../../components/loading/loading";
// import logger from '../../server/logger/logger';

const GroupsPage = () => {

    const PAGE_TITLE = 'View Groups'
    const [groups, setGroups] = useState([]);
    const [group, setGroup] = useState(null);
    const [users, setUsers] = useState([]);
    const { status, data: session } = useSession();
    const [isFetching, setFetching] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [groupSelectValue, setGroupSelectValue] = useState('');
    const [err, setErr] = useState('')

    const handleSelect = async (e) => {
        setGroupSelectValue(e.target.value)
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        await setUsers([]);
        await setSubmitted(true);
        await setFetching(true);
        await setGroup(await fetchGroup());
        await setUsers(await fetchMembers());
        await setFetching(false);
    }

    useEffect(() => {
        if (groups.length === 0 && status === 'authenticated') {
            const fetchGroups = async () => {
                setGroups(
                    await fetch('/api/groups', {
                        method: 'GET', headers: {
                            Authorization: "Bearer " + session.token['accessToken']
                        }
                    }).then(d => d.json()).then(d => {
                        setFetching(false);
                        return d;
                    }).catch(e => setErr(JSON.stringify(e)))
                )
            }
            fetchGroups();

        }
    }, [status, session, err]);

    const fetchGroup = async () => {
        return await fetch('/api/groups/' + groupSelectValue, {
            method: 'GET',
            headers: { Authorization: "Bearer " + session.token['accessToken'] }
        }).then(async (res) => {
            if (res.status === 200) return res.json()
            else throw await res.json().then((data) => { return data })
        }).then((data) => {
            return data;
        }).catch((error) => {
            return null;
        })
    }

    const fetchMembers = async () => {
        return await fetch('/api/groups/' + groupSelectValue + '/members', {
            method: 'GET',
            headers: { Authorization: "Bearer " + session.token['accessToken'] }
        }).then(async (res) => {
            if (res.status === 200) return res.json()
            else throw await res.json().then((data) => { return data })
        }).then((data) => {
            return data;
        }).catch((error) => {
            return null;
        })
    }

    const showGroup = () => {
        if (!submitted) return <></>

        if (isFetching) return <>
            <Loading />
        </>

        if (!group) return <></>

        return <>
            <ListGroup className='mb-3'>
                <ListGroupItem>
                    <Badge bg="primary" >
                        {group.name}
                    </Badge>
                    &nbsp;
                    <pre>
                        {JSON.stringify(group, null, '  ')}
                    </pre>
                </ListGroupItem>
            </ListGroup>
        </>
    }
    const showList = () => {

        if (!submitted) return <></>

        if (isFetching) return <>
            <Loading />
        </>

        if (submitted && users?.length === 0) return <>
            <ListGroup>
                <ListGroupItem>
                    No results
                </ListGroupItem>
            </ListGroup>
        </>

        return <>
            <ListGroup>
                <ListGroupItem>{users?.length} result{users?.length > 1 ? 's' : ''}</ListGroupItem>
                {
                    users?.map((u, i) =>
                        <ListGroupItem key={i} variant={i % 2 == 1 ? 'dark' : ''}>
                            {i+1}. <User username={null} user={u} showGroups={false}/>
                        </ListGroupItem>
                    )
                }
            </ListGroup >
        </>
    }


    return (
        <>
            <Layout>
                <Head>
                    <title>Users Manager - {PAGE_TITLE}</title>
                </Head>
                <h4>{PAGE_TITLE}</h4>
                <Form onSubmit={handleSubmit}>
                    <Form.Group as={Row} className="mb-3" controlId="formUser" >
                        <Col sm={10}>
                            <Form.Select onChange={handleSelect} value={groupSelectValue} id="groupsSelect">
                                <option value=""></option>
                                {!!groups && !isFetching
                                    ? groups.map((g, i) => {
                                        return <option key={i} value={g['id']}>{g['path']}</option>
                                    })
                                    : <></>
                                }
                            </Form.Select>
                        </Col>
                        <Col sm={2} style={{ textAlign: 'right' }}>
                            {status === 'authenticated' ? <>
                                <Button type='submit'>OK</Button>
                            </> : <Loading />
                            }
                        </Col>
                    </Form.Group>
                </Form>
                <div>
                    {showGroup()}
                </div>
                <div>
                    {showList()}
                </div>
            </Layout>
        </>
    );

}

export default GroupsPage