import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { Form } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';

function Settings({ config, hidden, setConfig, setHidden, setToken }) {
    function save() {
        const token = document.getElementById("tokenInput").value;
        const model = document.getElementById("modelInput").value;
        const instructions = document.getElementById("instructionsInput").value;

        if (token) {
            setToken(token);
        }
        setConfig({
            model: model,
            instructions: instructions,
        })
        setHidden(true);
    }

    return (
        <>
            <Modal show={!hidden} fullscreen="sm-down" size="xl" onHide={() => setHidden(true)}>
                <Modal.Header closeButton>
                    <Modal.Title>Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form autoComplete="off" onSubmit={e => { e.preventDefault(); }}>
                        <Form.Label htmlFor="tokenInput">Token</Form.Label>
                        <Form.Control
                            type="password"
                            autoComplete="off"
                            name="apiTokenInput"
                            // as="textarea"
                            id="tokenInput"
                        // onChange={onChangeInput}
                        />
                        <Form.Label htmlFor="modelInput">Model</Form.Label>
                        <Form.Select
                            id="modelInput"
                            name="modelInput">
                            <option value="gpt-4o">gpt-4o</option>
                        </Form.Select>

                        <Form.Label htmlFor="instructionsInput">Instructions</Form.Label>
                        <Form.Control
                            as="textarea"
                            id="instructionsInput"
                            name="instructionsInput"
                            defaultValue={config.instructions}
                            rows={4}
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={save} variant="primary">Save changes</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default Settings;
