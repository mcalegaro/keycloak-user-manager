import { signIn, signOut, useSession } from "next-auth/react"
import logger from "../service/logger/logger";
import { kcCfg } from "./keycloak.config"

export default function LoginBtn({ id }) {
  const { data: session } = useSession()
  if (session) {
    // const kcLogoutPath = `${kcCfg.url}/realms/${kcCfg.realm}/protocol/openid-connect/logout?redirect_uri=${window.location.href}`;
    return (
      <>
        {/* Signed in as {session.user.name} <br /> */}
        <button id={id} onClick={
          async () => {
            await signOut({ redirect: false })
            // window.location.href = kcLogoutPath
          }
        }>Sign out</button>
      </>
    )
  }
  return (
    <>
      {/* Not signed in <br /> */}
      <button onClick={() => signIn("keycloak")}>Sign in</button>
    </>
  )
}