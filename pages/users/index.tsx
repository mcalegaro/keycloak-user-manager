import { signIn, useSession } from 'next-auth/react';
import Head from "next/head";
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Col, Form, ListGroup, ListGroupItem, Row, Spinner } from "react-bootstrap";
import User from '../../components/fragments/user';
import Layout from "../../components/layout/layout";
import Loading from "../../components/loading/loading";
// import logger from '../../server/logger/logger';

const UsersPage = () => {

    const [queryValue, setQueryValue] = useState('');
    const [users, setUsers] = useState({});
    const { status, data: session } = useSession();
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [query, setQuery] = useState('')
    const [refresh, setRefresh] = useState(false);

    const handleSelect = (e) => {
        setQuery(e.target.value)
    }

    const handleChange = (ev) => {
        setQueryValue(ev.target.value);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUsers({ loading: true });
        setSubmitted(true);
        fetchUsers();
    }

    useEffect(() => {

    }, [status, session, users, refresh]);

    const fetchUsers = () => {
        fetch('/api/users?' + query + '=' + queryValue, {
            method: 'GET',
            headers: { Authorization: "Bearer " + session.token['accessToken'] }
        })
            .then(async (d) => {
                if (d.status === 200) {
                    d.json().then(async (us) => {
                        setUsers({ loading: false, data: us })
                        for (const u of us) {
                            const groups = await fetch('/api/users/' + u.id + '/groups', { headers: { Authorization: 'Bearer ' + session.token['accessToken'] } })
                                .then(async (d) => {
                                    if (d.status === 200) {
                                        return await d.json().then(gs => gs)
                                    } else {
                                        return []
                                    }
                                })
                            u.groups = groups;
                            setRefresh(r => !r)
                        }
                    })
                } else {
                    d.json().then(body => {
                        console.error(body)
                        setError(body)
                        setUsers({})
                    })
                }
            }).catch((error) => {
                console.error('error:', JSON.stringify(error))
                setError(error)
                setUsers({})
            })
    }

    const showList = () => {

        if (!submitted) return <></>

        if (users['loading']) return <>
            <Loading />
        </>

        if (error) return <>
            <Alert variant='danger'>Error: {JSON.stringify(error)}</Alert>
        </>

        if (submitted && users['data']?.length === 0) return <>
            <ListGroup>
                <ListGroupItem>
                    No results
                </ListGroupItem>
            </ListGroup>
        </>

        return <>
            <ListGroup>
                <ListGroupItem>{users['data']?.length} result{users['data']?.length > 1 ? 's' : ''}</ListGroupItem>
                {
                    users['data']?.map((u, i) =>
                        <ListGroupItem key={i} variant={i % 2 == 1 ? 'dark' : ''}>
                            {i+1}. <User username={null} user={u} showGroups={true}/>
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
                    <title>Users Manager - List Users</title>
                </Head>
                <h4>List Users</h4>
                <Form onSubmit={handleSubmit}>
                    <Form.Group as={Row} className="mb-3" controlId="formUser" >
                        {/* <Form.Label column sm={2}><span className="text-nowrap">User name</span></Form.Label> */}
                        <Col sm={5}>
                            <Form.Select value={query} onChange={handleSelect} required autoFocus>
                                <option value=""></option>
                                <option value="username">username</option>
                                <option value="email">email</option>
                                <option value="firstName">firstName</option>
                                <option value="lastName">lastName</option>
                                <option value="search">search (username, first or last name, or email)</option>
                            </Form.Select>
                        </Col>
                        {/* </Form.Group>
                    <Form.Group as={Row} className="mb-3" controlId="formUser" > */}
                        {status === 'authenticated' ? <>
                            <Col sm={5}>
                                <Form.Control type="text" placeholder={query} value={queryValue}
                                    onChange={handleChange} required minLength={4} />
                            </Col>
                            <Col sm={2} style={{ textAlign: 'right' }}>
                                <Button type='submit'>OK</Button>
                            </Col>
                        </> : <Loading />
                        }
                    </Form.Group>
                </Form>
                <div>
                    {showList()}
                </div>
            </Layout>
        </>
    );

}

export default UsersPage