import { useSession } from 'next-auth/react';
import Head from "next/head";
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Col, Form, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import Layout from "../../components/layout/layout";
import Loading from "../../components/loading/loading";
import logger from '../../server/logger/logger';

const ListPage = () => {

    const [userName, setUserName] = useState('');
    const [users, setUsers] = useState([]);
    const { status, data: session } = useSession();
    const [error, setError] = useState(null);
    const [isFetching, setFetching] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (ev) => {
        setUserName(ev.target.value);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUsers([]);
        setSubmitted(true);
        setFetching(true)
        doFetch()
    }

    useEffect(() => {

    }, [status, session]);

    const doFetch = () => {
        fetch(
            '/api/users?username=' + userName,
            {
                method: 'GET',
                headers: {
                    Authorization: "Bearer " + session.token['accessToken']
                }
            }
        )
            .then(async (res) => {
                if (res.status === 200) return res.json()
                else throw await res.json().then((data) => { return data })
            })
            .then((data) => {
                setUsers(data);
                setFetching(false);
            }).catch((error) => {
                setError(error);
                setFetching(false);
                setUsers(null);
            })
    }

    const showList = () => {

        if (!submitted) return <></>

        if (isFetching) return <>
            <Loading />
        </>

        if (error) return <>
            <Alert variant='danger'>Error: {error.message}</Alert>
        </>

        if (submitted && users.length === 0) return <>
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
                            {JSON.stringify(u, null, '\t')}
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
                        <Form.Label column sm={2}><span className="text-nowrap">User name</span></Form.Label>
                        {status === 'authenticated' ? <>
                            <Col sm={4}>
                                <Form.Control autoFocus type="text" placeholder="User name" value={userName}
                                    onChange={handleChange} required minLength={4} />
                            </Col>
                            <Col sm={2}>
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

export default ListPage