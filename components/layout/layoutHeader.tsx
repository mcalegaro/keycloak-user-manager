import { useSession } from 'next-auth/react';
import Head from "next/head";
import Router from "next/router";
import { useEffect, useState } from 'react';
import { Container, Nav, Navbar } from "react-bootstrap";
import { kcCfg, kcRoles } from "../keycloak.config";
import Loading from '../loading/loading';
import { logout } from './auth/withAuth';
import { siteTitle } from "./layout";

const SELECT_LIST = { key: "list", value: "List" }
const SELECT_UPDATE = { key: "update", value: "Update" }
const SELECT_LOGOUT = { key: "logout", value: "Logout" }

export default function LayoutHeader(props) {

    const { data: session, status } = useSession()
    const [adminRole, setAdminRole] = useState()

    const home = () => {
        Router.push('/')
    }

    useEffect(() => {
        if (status === 'authenticated') {
            setAdminRole(session['token']['hasAdminRole'])
        }
    }, [session, status])

    const prepareLogout = async () => {
        await logout();
    }

    return <>
        <Head>
            <link rel="icon" href="/favicon.ico" />
            <meta
                name="description"
                content={`Manage Users from keycloak ${kcCfg.realm}`}
            />
            <meta
                property="og:image"
                content={`https://og-image.vercel.app/${encodeURI(
                    siteTitle,
                )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
            />
            <meta name="og:title" content={siteTitle} />
            <meta name="twitter:card" content="summary_large_image" />
        </Head>
        <Navbar bg="light" expand="sm" onSelect={
            async (selectedKey) => {
                switch (selectedKey) {
                    case SELECT_LIST.key:
                        Router.push('/users')
                        break;
                    case SELECT_UPDATE.key:
                        Router.push('/users/update')
                        break;
                    case SELECT_LOGOUT.key:
                        await prepareLogout()
                        break;
                    default:
                        console.log(`selected ${selectedKey}`)
                        break;
                }
            }
        }>
            <Container>
                <Navbar.Brand href='#' onClick={home}>Users Manager</Navbar.Brand>
                {status === 'loading'
                    ? <> <Loading /> </>
                    : <>
                        {status === 'authenticated'
                            ?
                            <>
                                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                                <Navbar.Collapse id="basic-navbar-nav">
                                    <Nav className="me-auto">
                                        <>
                                            <Nav.Link eventKey={SELECT_LIST.key}>
                                                {SELECT_LIST.value}
                                            </Nav.Link>
                                            {adminRole ?
                                                <Nav.Link eventKey={SELECT_UPDATE.key}>{SELECT_UPDATE.value}</Nav.Link>
                                                : <></>
                                            }
                                            <Nav.Link href="#" eventKey={SELECT_LOGOUT.key}>{SELECT_LOGOUT.value}</Nav.Link>
                                        </>
                                    </Nav>
                                </Navbar.Collapse>
                            </>
                            :
                            <></>
                        }
                    </>
                }
            </Container>
        </Navbar>
    </>
}