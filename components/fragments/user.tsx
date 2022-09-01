import { Badge, Spinner } from "react-bootstrap";

export default function User({ username, user, showGroups }) {
    return <>
        <Badge bg="primary" >
            {username ? username.toUpperCase() : user.username.toUpperCase()}
        </Badge>
        &nbsp;
        {username ? `${user.username.toUpperCase()} ` : ''}
        <span style={!user.emailVerified ? { color: 'darkred' } : {}}>{user.email}</span>, {user.firstName} {user.lastName}&nbsp;
        {!showGroups ? '' : user.groups === undefined ? <Spinner animation='border' size='sm' /> : JSON.stringify(user.groups.map((g, i) => g.path), null, ' ')}
    </>
}