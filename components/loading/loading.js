import { Spinner } from "react-bootstrap";

export default function Loading() {
    return (
        <Spinner animation="border" role="status" className="mt-3">
            <span className="visually-hidden">Loading...</span>
        </Spinner>
    );
}