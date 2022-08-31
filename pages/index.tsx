import { stat } from 'fs';
import { signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { kcCfg } from '../components/keycloak.config';
import Layout, { siteTitle } from '../components/layout/layout';
import Loading from '../components/loading/loading';

const Home = () => {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setLoading(false)
    }
  }, [loading, status])

  const logout = async (ev) => {
    const logoutPath = `${kcCfg.url}/realms/${kcCfg.realm}/protocol/openid-connect/logout?redirect_uri=${window.location.href}/login/reLogin`;
    await signOut({ redirect: false })
    window.location.href = logoutPath
  }

  return <>
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section >
        <div>
          {
            loading ? <Loading /> : status === 'authenticated' ?
              <p className='mt-3'>
                <i>{session.user.name}</i> connected to {kcCfg.url}/realms/{kcCfg.realm}
              </p> : <></>
          }
          {/* <p>
            Hello {status == 'authenticated'
              ? <>
                {session.user.name}! Not you? <Button onClick={logout}>Switch User</Button>
              </>
              : '!'
            }
          </p>
          <LoginBtn id='btLogin' /> */}
        </div>
      </section>
    </Layout>
  </>;
}

export default Home