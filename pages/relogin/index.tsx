import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

import Loading from '../../components/loading/loading'

export default function reLogin() {
    const { status, data: session } = useSession()
    const router = useRouter()

    if (typeof window !== 'undefined') {
        if (status !== 'authenticated') {
            signIn('keycloak', { callbackUrl: `${window.location.origin}/` })
        } else {
            // return <>
            //     <p>{session.user} at {kcCfg.url}</p>
            // </>
            router.push('/users')
        }
    }
    return <Loading />;
}