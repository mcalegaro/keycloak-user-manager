import { NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
// import logger from "../../../server/logger/logger";
import Loading from "../../loading/loading";
import { kcCfg, kcRoles } from "../../keycloak.config";
import AccessDenied from "../../../pages/accessDenied/index";
import { signOut } from "next-auth/react";
import { Button, Container } from "react-bootstrap";

const withAuth =
    // <PageProps extends Record<string, unknown>>
    (
        Page
        // : NextPage<PageProps>

    ) => ({ ...props }) => {
        //: NextPage<PageProps> 

        const { status, data: session } = useSession();
        const [userRole, setUserRole] = useState();
        const [loading, setLoading] = useState(true);
        const [loggingIn, setLoggingIn] = useState(false);

        useEffect(() => {
            if (!loggingIn) setLoading(false)
            if (status === 'authenticated' && session) {
                setLoggingIn(false)
                if (session.expired) {
                    setLoading(true)
                    signOut()
                }
                setUserRole(session['token']['hasUserRole']);
            }
        }, [session, status, loading])

        const login = (e) => {
            setLoading(true)
            setLoggingIn(true)
            signIn('keycloak', { redirect: false })
        }

        return (
            <>
                {loading
                    ? <Loading />
                    : status === 'unauthenticated'
                        ? <>
                            <br />
                            <Button onClick={login} autoFocus>
                                Login
                            </Button>
                        </>
                        : (status === 'authenticated' && userRole !== undefined && !userRole)
                            ?
                            <AccessDenied />
                            :
                            <Page {...(props
                                //  as PageProps
                            )} />
                }
            </>
        )

    }

export default withAuth

export const logout = async () => {
    const logoutPath = `${kcCfg.url}/realms/${kcCfg.realm}/protocol/openid-connect/logout?redirect_uri=${window.location.href}`;
    await signOut({ redirect: true })
    window.location.href = logoutPath
}