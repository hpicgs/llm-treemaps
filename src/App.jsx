import { useEffect, useRef, useState } from 'react'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import './App.css'

import Chat from './components/Chat'
import Header from './components/Header'
import Notification from './components/Notification'
import Settings from './components/Settings'
import Treemap from './components/Treemap'

import defaultConfig from './config'

import { AppController } from './utils/app'
import { parseCsv } from './utils/fetch'
import { configFromFileTree, createFileTree } from './utils/treemap_helpers'

let assistant = null;
let nextMessageId = 0;

// Message data format:
// const messages = [
//   { id: "1", from: "user", content: "Can you create a config?" },
//   { id: "2", from: "assistant", type: "", content: "yes", system: { mapping: { height: "nof", colors: "dc" } } }
//   { id: "3", from: "assistant", type: "code", content: "import pandas as pd" }
// ]

function App() {
  const [notification, setNotification] = useState({ source: "System", message: "supply api token in settings" });
  const [messages, setMessages] = useState([]);
  // const [data, setData] = useState();
  const [treemapConfig, setTreemapConfig] = useState(null);
  const [config, setConfig] = useState({ model: defaultConfig.model, instructions: defaultConfig.instructions });

  const [formLocked, setFormLocked] = useState(true);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [settingsHidden, setSettingsHidden] = useState(true);

  const treemapRef = useRef();

  useEffect(() => {
    async function fetchData() {
      const csv = await parseCsv("/webgl-operate.csv");
      const fileTree = createFileTree(csv.rows);
      setTreemapConfig(configFromFileTree(fileTree))

      // setData(csv);
    }
    fetchData();
    // return () => {

    // };
  }, []);

  function onAssistantState(ready) {
    setFormLocked(!ready);
  }

  function onReceiveMessage(message, type = "text") {
    setMessages(prevMessages => (
      [...prevMessages, { id: nextMessageId++, from: "assistant", type: type, content: message }]));
  }

  function onUpdateLatestAssistantMessage(word) {
    setMessages(prevMessages => {
      const lastAssistantMessageIdx = prevMessages.length - 1;

      const updatedMessages = [...prevMessages];

      updatedMessages[lastAssistantMessageIdx] = {
        id: updatedMessages[lastAssistantMessageIdx].id,
        from: "assistant",
        type: updatedMessages[lastAssistantMessageIdx].type,
        content: updatedMessages[lastAssistantMessageIdx].content + word
      }

      return updatedMessages;
    })
  }

  function onSystemMessage(system) {
    setMessages(prevMessages => {
      const lastAssistantMessageIdx = prevMessages.length - 1;

      const updatedMessages = [...prevMessages];

      updatedMessages[lastAssistantMessageIdx] = {
        id: updatedMessages[lastAssistantMessageIdx].id,
        from: "assistant",
        type: updatedMessages[lastAssistantMessageIdx].type,
        content: updatedMessages[lastAssistantMessageIdx].content,
        system: system
      }

      return updatedMessages;
    })

    if (system.mapping) {
      applyTreemapMapping(system.mapping);
    }
    if (system.highlight) {
      applyTreemapHighlighting(system.highlight);
    }
  }

  function applyTreemapMapping(mapping) {
    console.log("(System) change mapping", mapping)
    treemapRef.current.changeMapping(mapping);
  }

  function applyTreemapHighlighting(highlight) {
    console.log("(System) highlight node", highlight)
    treemapRef.current.highlightNode(highlight);
  }

  function onChangeToken(token) {
    assistant = new AppController({
      instructions: defaultConfig.instructions,
      model: defaultConfig.model,
      setAssistantBusy: setAssistantBusy,
      onReadyCallback: onAssistantState,
      onMessageCallback: onReceiveMessage,
      onSystemCallback: onSystemMessage,
      onUpdateLatestAssistantMessage: onUpdateLatestAssistantMessage,
      onNotificationCallback: setNotification
    })
    assistant.setToken(token)
  }

  function onChangeConfig(config) {
    // TODO init new assistant
    setConfig(config);
  }

  function sendMessage(message) {
    setAssistantBusy(true);
    setMessages(prevMessages => (
      [...prevMessages, { id: nextMessageId++, from: "user", content: message }]));
    assistant.sendMessage(message);
  }


  return (
    <>
      <Notification {...notification} />
      <Container fluid>
        <Settings
          config={config}
          hidden={settingsHidden}
          setConfig={onChangeConfig}
          setHidden={setSettingsHidden}
          setToken={onChangeToken} />

        <Header hideSettings={setSettingsHidden} />
        <Row className='appContent vh-100'>
          <Col lg={5} className='chatWindow position-absolute start-0 top-0 h-100 overflow-hidden'>
            <Chat
              messages={messages}
              onSendMessage={sendMessage}
              formLocked={formLocked}
              assistantBusy={assistantBusy}
              applyTreemapMapping={applyTreemapMapping}
              applyTreemapHighlighting={applyTreemapHighlighting} />
          </Col>
          <Col lg={7} className='canvasWindow position-absolute end-0 top-0 h-100'>
            {treemapConfig && <Treemap config={treemapConfig} ref={treemapRef} />}
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default App
