import { useSession } from 'next-auth/react';
import Head from "next/head";
import { useEffect, useState } from "react";
import { Badge, Button, Col, Form, ListGroup, ListGroupItem, Pagination, Row } from "react-bootstrap";
import User from '../../components/fragments/user';
import Layout from "../../components/layout/layout";
import Loading from "../../components/loading/loading";
// import logger from '../../server/logger/logger';

const GroupsPage = () => {
    const PAGE_TITLE = 'View Groups'
    const [pageSize, setPageSize] = useState(parseInt(process.env.NEXT_PUBLIC_pageSize));
    const [groups, setGroups] = useState([]);
    const [group, setGroup] = useState(null);
    const [users, setUsers] = useState([]);
    const { status, data: session } = useSession();
    const [isFetching, setFetching] = useState(true);
    const [isFetchingGroup, setFetchingGroup] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [groupSelectValue, setGroupSelectValue] = useState('');
    const [err, setErr] = useState('');
    const [pageActive, setPageActive] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [addNextPage, setAddNextPage] = useState(true);

    const changePageSize = async (e) => {
        const newPageSize = e.target.value;
        if (newPageSize > 100 || newPageSize < 10) {
            return;
        }
        await setPageSize(newPageSize);
    }

    const handleSelect = async (e) => {
        setGroupSelectValue(e.target.value)
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        await setAddNextPage(true);
        await setLastPage(1);
        await setPageActive(1);
        await setUsers([]);
        await setSubmitted(true);
        await setGroup(await fetchGroup());
        await setUsers(await fetchMembers(1));
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
        await setFetchingGroup(true);
        const resp = await fetch('/api/groups/' + groupSelectValue, {
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
        setFetchingGroup(false);
        return resp;
    }

    const fetchMembers = async (page) => {
        await setFetching(true);
        const first = (page - 1) * pageSize;
        const resp = await fetch('/api/groups/' + groupSelectValue
            + '/members?first=' + (isNaN(first) ? 0 : first)
            + '&max=' + pageSize, {
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
        await setFetching(false);
        return resp;
    }

    const showGroup = () => {
        if (!submitted) return <></>

        if (isFetchingGroup) return <>
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
                        {/* {JSON.stringify(group, null, '  ')} */}
                        Id: {group.id}<br />
                        Path: {group.path}<br />
                        Attributes: {JSON.stringify(group.attributes, null, ' ')}<br />
                    </pre>
                </ListGroupItem>
            </ListGroup>
        </>
    }

    const fetchPage = async (e) => {
        await setFetching(true);
        const page = parseInt(e.target.text);
        await setPageActive(isNaN(page) ? 0 : page);
        await setUsers(await fetchMembers(page));
        await setFetching(false);
    }

    const nextPage = async (e) => {
        await setFetching(true);
        await setPageActive(lastPage + 1);
        const usersAux = await fetchMembers(lastPage + 1);
        await setUsers(usersAux);
        await setAddNextPage(usersAux.length >= pageSize);
        await setLastPage(lastPage + 1);
        await setFetching(false);
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

        let items = [];
        for (let number = 1; number <= lastPage; number++) {
            items.push(
                <Pagination.Item key={number}
                    disabled={number === pageActive}
                    active={number === pageActive}
                    onClick={fetchPage}
                >
                    {number}
                </Pagination.Item>,
            );
        }
        if (addNextPage && users.length >= pageSize) {
            items.push(<Pagination.Item key='next' onClick={nextPage}>
                ...
            </Pagination.Item>,);
        }
        return <>
            <Pagination size="sm" className='mb-3'>{items}</Pagination>
            <ListGroup>
                <ListGroupItem>{users?.length} result{users?.length > 1 ? 's' : ''}</ListGroupItem>
                {
                    users?.map((u, i) =>
                        <ListGroupItem key={i} variant={i % 2 == 1 ? 'dark' : ''}>
                            {i + 1}. <User username={null} user={u} showGroups={false} />
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
                        <Col sm={9}>
                            <Form.Label>Group</Form.Label>
                            <Form.Select onChange={handleSelect} value={groupSelectValue} id="groupsSelect" required>
                                <option value=""></option>
                                {!!groups
                                    ? groups.map((g, i) => {
                                        return <option key={i} value={g['id']}>{g['path']}</option>
                                    })
                                    : <></>
                                }
                            </Form.Select>
                        </Col>
                        <Col sm={2}>
                            <Form.Label>Page Size</Form.Label>
                            <Form.Control type="number" placeholder="Page Size" value={pageSize} onChange={changePageSize} />
                        </Col>
                        <Col sm={1} className="d-flex align-items-end text-align-right justify-content-end" >
                            {/* <Form.Label>&nbsp;</Form.Label> */}
                            {/* <Form.Control type='text' size='1'></Form.Control> */}
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