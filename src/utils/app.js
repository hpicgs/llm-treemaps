import { getFile } from "./fetch";
import { OpenAIClient } from "./openAI";


export class AppController {
    constructor({
        instructions,
        model = "gpt-4o",
        filename = "webgl-operate.csv",
        setAssistantBusy,
        onReadyCallback,
        onMessageCallback,
        onSystemCallback,
        onUpdateLatestAssistantMessage,
        onNotificationCallback
    }) {
        this._assistant = null;
        this.instructions = instructions;
        this.model = model;
        this._filename = filename;
        this._setAssistantBusy = setAssistantBusy;
        this._readyCallback = onReadyCallback;
        this._messageCallback = onMessageCallback;
        this._onSystemCallback = onSystemCallback;
        this._onUpdateLatestAssistantMessage = onUpdateLatestAssistantMessage;
        this._notificationCallback = onNotificationCallback;

        this._systemMessage = false;
        this._systemMessageContent = "";
    }

    async setToken(token) {
        this._assistant = new OpenAIClient({
            apiKey: token,
            instructions: this.instructions,
            model: this.model
        });
        this._assistant.init()
            .then(() => { return this.fetchApiFile(this._filename); })
            .then((file) => { return this._assistant.initThread(file); })
            .then(() => {
                this._readyCallback(true);
                this._notificationCallback({ source: "System", message: "API Token valid" })
            })
    }

    async fetchApiFile(filename) {
        let file = await this._assistant.getFile(filename);

        if (!file) {
            const fileBlob = await getFile(filename);
            file = await this._assistant.uploadFile(fileBlob);
        }

        return file;
    }

    sendMessage(text) {
        this._readyCallback(false);

        this._assistant.streamMessage(
            text,
            this)
    }

    _onTextCreated(type = "text") {
        this._checkSystemMessage();
        this._messageCallback("", type);
        this._setAssistantBusy(false);
    }

    _onTextDelta(word) {
        if (word === "```") {
            this._systemMessage = true;
        }

        if (!this._systemMessage) {
            this._onUpdateLatestAssistantMessage(word);
        } else {
            if (word === "json" || word === "```") return
            this._systemMessageContent += word
        }
    }

    _onRunCompleted() {
        this._checkSystemMessage();
        this._readyCallback(true);
    }

    _checkSystemMessage() {
        if (!this._systemMessage) return

        console.log(this._systemMessageContent)

        const system = JSON.parse(this._systemMessageContent);

        this._onSystemCallback(system);

        this._systemMessage = false;
        this._systemMessageContent = "";
    }
}
