import { useState } from "react";
import { Toast } from "react-bootstrap";

const MsgToast = ({ title, msg, showFunc }) => {
    // const [show, setShow] = useState(true)
    return (
        <Toast
            // show={show} 
            onClose={() => {
                // setShow(false);
                showFunc(false);
            }}>
            <Toast.Header>
                {/* <img src="holder.js/20x20?text=%20" className="rounded me-2" alt="" /> */}
                <strong className="me-auto">{title}</strong>
                {/* <small>11 mins ago</small> */}
            </Toast.Header>
            <Toast.Body>{msg}</Toast.Body>
        </Toast >
    );
}

export default MsgToast