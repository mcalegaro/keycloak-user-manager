import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import Loading from '../loading/loading';
import AuthContent from './auth/authContent';
import LayoutFooter from './layoutFooter';
import LayoutHeader from './layoutHeader';
export const siteTitle = 'Users Manager';

interface LayoutProps extends Record<string, unknown> {
  children: any,
  adminsOnly?: boolean
}

const Layout = (props) => {
  const { status, data: session } = useSession();
  const [adminRole, setAdminRole] = useState();
  const { children, adminsOnly } = props;

  useEffect(
    () => {
      if (status === 'authenticated') {
        setAdminRole(session['token']['hasAdminRole']);
      }
    }
    , [session, status]);


  return <>
    <LayoutHeader />
    <Container>
      {status === 'loading'
        ?
        <Loading />
        :
        <>
          <AuthContent adminsOnly={adminsOnly}>
            {children}
          </AuthContent>
        </>
      }
      <LayoutFooter />
    </Container>
  </>;

}

export default Layout