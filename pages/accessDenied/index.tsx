import { useEffect, useState } from "react";
import { Alert, Button, Container } from "react-bootstrap"
import { logout } from "../../components/layout/auth/withAuth";

const waitTimeout = 5000;

const AccessDenied = () => {
    const [resting, setResting] = useState(0);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        if (!loggingOut) {
            setLoggingOut(true)
            startLogout()
        }
    }, [loggingOut])
    return (
        <Container>
            <p></p>
            <Alert key='danger' variant='danger'>
                Sorry, permission denied. You'll be logged out in {resting / 1000} seconds...
            </Alert>
            <Button className='mb-3' onClick={logout}>Logout</Button>
        </Container>
    )


    function startLogout() {
        setResting(waitTimeout)
        logoutTimeout();
        const interval = setInterval(() => {
            setResting((counter) => counter - 1000);
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }


    function logoutTimeout() {
        setResting(waitTimeout)
        setTimeout(async () =>
            await logout(), waitTimeout
        )
    }
}

export default AccessDenied