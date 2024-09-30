import { Search, Sliders2Vertical } from 'react-bootstrap-icons';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Markdown from 'react-markdown'
import SyntaxHighlighter from 'react-syntax-highlighter';
import styles from '../styles/chat.module.css'
import { Row } from 'react-bootstrap';
import { createRef, useEffect } from 'react';


function LoadingMessage() {
    const key = Number.MAX_SAFE_INTEGER

    return (
        <li key={key} className={styles.message}>
            <div className={styles.messageContent}>
                <div className={styles.username}>assistant</div>
                <div className="spinner-grow text-warning" role="status" />
            </div>
        </li >
    )
}

function Message(msg, applyTreemapMapping, applyTreemapHighlighting, isFirst) {
    const messageStyle = msg.from === "user" ?
        `${styles.message} ${styles.user}` : styles.message;
    return (

        <li key={msg.id} className={messageStyle}>
            <div className={styles.messageContent}>
                {isFirst && <div className={styles.username}>{msg.from}</div>}
                <div className={`${styles.text} ${msg.system && styles.systemText} ${msg.type === "code" && styles.code}`}>
                    {(msg.type !== "code") ? (
                        <Markdown>{msg.content}</Markdown>
                    ) : (
                        <SyntaxHighlighter language='python' showLineNumbers>{msg.content}</SyntaxHighlighter>
                    )}
                </div>
                <div className={styles.system}>
                    {msg.system && msg.system.mapping && < Sliders2Vertical
                        className={styles.icons}
                        size={28}
                        onClick={() => applyTreemapMapping(msg.system.mapping)}
                        title="Re-apply mapping" />}
                    {msg.system && msg.system.highlight && < Search
                        className={styles.icons}
                        size={28}
                        onClick={() => applyTreemapHighlighting(msg.system.highlight)}
                        title="Re-apply highlighting" />}
                </div>
            </div>
        </li>
    )
}

export default function Chat({ messages, onSendMessage, formLocked, assistantBusy, applyTreemapMapping, applyTreemapHighlighting }) {
    const messagesEndRef = createRef()

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    function handleSubmit(event) {
        event.preventDefault();
        onSendMessage(event.target.elements.userMessage.value);
        event.target.elements.userMessage.value = "";
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages]);

    return (
        <>
            <Row style={{ height: "90%", paddingBottom: "1em" }}>
                <ul className={`${styles.messageList} h-100 overflow-auto`}>
                    {messages.map((msg, i, allMsg) => {
                        var isFirst = true;
                        if (i>0) {isFirst = allMsg[i-1].from !== msg.from}
                        return Message(msg, applyTreemapMapping, applyTreemapHighlighting, isFirst)
                    })}
                    {assistantBusy && <LoadingMessage />}
                    <div ref={messagesEndRef} />
                </ul>
            </Row>
            <Row className="w-100 position-absolute bottom-0" style={{ height: "10%" }}>
                <Form autoComplete="off" onSubmit={handleSubmit}>
                    <InputGroup>
                        <Form.Control
                            type="text"
                            name="userMessage"
                            autoComplete="off"
                            disabled={formLocked} />
                        <Button type="submit" disabled={formLocked}>Send</Button>
                    </InputGroup>
                </Form>
            </Row>
        </>
    )
}
