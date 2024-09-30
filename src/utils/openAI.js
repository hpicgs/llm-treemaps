import OpenAI from 'openai';


export class OpenAIClient {
    constructor({ apiKey, instructions, model }) {
        this.name = "llm-viz-assistant"
        this._client = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });
        this._instructions = instructions;
        this._model = model;
        this._assistant = null;
        this._thread = null;
    }

    async init() {
        this._assistant = await this.getAssistant();
    }

    async getAssistant() {
        const assistants = await this._client.beta.assistants.list({
            order: 'desc',
            limit: 20
        });

        let assistant = assistants.data.find(assistant => assistant.name === this.name);

        if (!assistant) {
            assistant = await this._client.beta.assistants.create({
                name: this.name,
                instructions: this._instructions,
                tools: [{ type: 'code_interpreter' }],
                model: this._model
            });
        }

        return assistant;
    }

    async sendMessage(message) {
        if (!this._thread) {
            await this.initThread();
        }

        await this._client.beta.threads.messages.create(
            this._thread.id,
            {
                role: "user",
                content: message
            }
        );
        const run = await this._client.beta.threads.runs.createAndPoll(
            this._thread.id,
            { assistant_id: this._assistant.id }
        );
        const messages = await this._client.beta.threads.messages.list(
            this._thread.id
        );

        return messages;
    }

    async streamMessage(message, ctrl) {
        if (!this._thread) {
            await this.initThread();
        }

        await this._client.beta.threads.messages.create(
            this._thread.id,
            {
                role: "user",
                content: message
            }
        );

        const run = this._client.beta.threads.runs.stream(this._thread.id, {
            assistant_id: this._assistant.id
        })
            .on("textCreated", content => { ctrl._onTextCreated() })
            .on("textDelta", (delta, snapshot) => { ctrl._onTextDelta(delta.value) })
            .on("event", event => {
                if (event.event === "thread.run.completed") {
                    ctrl._onRunCompleted()
                }
            })
            .on("toolCallCreated", (toolCall) => { ctrl._onTextCreated("code") })
            .on("toolCallDelta", (toolCallDelta, snapshot) => {
                if (toolCallDelta.type !== 'code_interpreter') {
                    return
                }

                if (toolCallDelta.code_interpreter.input) {
                    ctrl._onTextDelta(toolCallDelta.code_interpreter.input);
                }
                if (toolCallDelta.code_interpreter.outputs) {
                    console.log("\nToolcall output >\n");
                    toolCallDelta.code_interpreter.outputs.forEach(output => {
                        if (output.type === "logs") {
                            console.log(`\n${output.logs}\n`);
                        }
                    });
                }
            })
    }

    async initThread(file = null) {
        const args = []
        if (file) {
            args.push({
                "tool_resources": {
                    "code_interpreter": {
                        "file_ids": [file.id]
                    }
                }
            });
        }
        this._thread = await this._client.beta.threads.create(...args);
    }

    async getFile(filename) {
        const files = await this._client.files.list();
        return files.data.find(file => file.filename === filename);
    }

    async uploadFile(fileBlob) {
        const file = await this._client.files.create({
            file: fileBlob,
            purpose: "assistants",
        });
        return file;
    }
}
