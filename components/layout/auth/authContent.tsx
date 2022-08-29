import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
// import logger from "../../../server/logger/logger";
import { kcCfg, kcRoles } from "../../keycloak.config";
import withAuth from "./withAuth";

interface AuthContentProps extends Record<string, unknown> {
    children: any,
    adminsOnly?: boolean
}

const AuthContent = ({ children, adminsOnly }) => {

    const [adminRole, setAdminRole] = useState();
    const { status, data: session } = useSession();

    useEffect(() => {
        setAdminRole(session['token']['hasAdminRole']);
    }, [])

    return <>
        {adminsOnly && !adminRole
            ? <>
                Admins Only.
            </>
            : <main>{children}</main>
        }
    </>
}

export default withAuth(AuthContent)