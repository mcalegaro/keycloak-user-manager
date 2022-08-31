import { useSession } from 'next-auth/react';
import Head from "next/head";
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Col, Form, ListGroup, ListGroupItem, Row } from "react-bootstrap";
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

    const handleSelect = async (e) => {
        setGroupSelectValue(e.target.value)
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUsers([]);
        setSubmitted(true);
        setFetching(true);
        fetchGroup();
        fetchMembers();
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
                    })
                )
            }
            fetchGroups();

        }
    }, [status, session]);

    const fetchGroup = () => {
        fetch('/api/groups/' + groupSelectValue, {
            method: 'GET',
            headers: { Authorization: "Bearer " + session.token['accessToken'] }
        })
            .then(async (res) => {
                if (res.status === 200) return res.json()
                else throw await res.json().then((data) => { return data })
            })
            .then((data) => {
                setGroup(data);
                setFetching(false);
            }).catch((error) => {
                setFetching(false);
                setGroup(null);
            })
    }

    const fetchMembers = () => {
        fetch('/api/groups/' + groupSelectValue + '/members', {
            method: 'GET',
            headers: { Authorization: "Bearer " + session.token['accessToken'] }
        })
            .then(async (res) => {
                if (res.status === 200) return res.json()
                else throw await res.json().then((data) => { return data })
            })
            .then((data) => {
                setUsers(data);
                setFetching(false);
            }).catch((error) => {
                setFetching(false);
                setUsers(null);
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
                            <Badge bg="primary" >
                                {u.username.toUpperCase()}
                            </Badge>
                            &nbsp;
                            Id: {u.id}
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