import { useSession } from 'next-auth/react';
import Head from "next/head";
import { useEffect, useState } from "react";
import { Alert, Badge, Col, Form, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import Layout from "../../components/layout/layout";
import Loading from "../../components/loading/loading";

const UsersPage = () => {

    const [userName, setUserName] = useState('');
    const [users, setUsers] = useState(null);
    const { status, data: session } = useSession();
    const [error, setError] = useState(null);
    const [isFetching, setFetching] = useState(false);

    const handleChange = (ev) => {
        setUserName(ev.target.value);
        setError(null);
    };

    useEffect(() => {
        if (userName) {
            setFetching(true)
            doFetch()
        } else {
            setUsers(null);
        }
    }, [status, session, userName]);

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
        if (!userName) return <></>

        if (isFetching) return <>
            <Loading />
        </>

        if (error) return <>
            <Alert variant='danger'>Error: {error.message}</Alert>
        </>

        if (!users || users.length === 0) return <>
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
                <Form >
                    <Form.Group as={Row} className="mb-3" controlId="formUser" >
                        <Form.Label column sm={2}><span className="text-nowrap">User name</span></Form.Label>
                        <Col sm={10}>
                            {status === 'authenticated'
                                ?
                                <>
                                    <Form.Control autoFocus type="text" placeholder="User name" value={userName} onChange={handleChange} />
                                </>
                                :
                                <Loading />
                            }
                        </Col>
                        {/* <Form.Text className="text-muted">

                        </Form.Text> */}
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