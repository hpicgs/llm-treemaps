import React, { useEffect, useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

function Notification({ source, message }) {
    const [show, setShow] = useState(false);

    const toggleShow = () => setShow(!show);

    useEffect(() => {
        toggleShow();
    }, [message]);

    return (
        <ToastContainer
            className="p-3"
            position={'top-center'}
            style={{ zIndex: 2000 }}
        >
            <Toast show={show} onClose={toggleShow} delay={5000} autohide>
                <Toast.Header>
                    <strong
                        className="me-auto"
                        style={{ color: source === "System" ? "darkred" : "darkblue" }}>
                        {source}
                    </strong>
                </Toast.Header>
                <Toast.Body>{message}</Toast.Body>
            </Toast>
        </ToastContainer>
    );
}

export default Notification;