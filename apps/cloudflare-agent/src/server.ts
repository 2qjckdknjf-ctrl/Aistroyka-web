import { Agent, unstable_callable, type Connection } from "agents";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  at: string;
};

type AgentState = {
  messages: ChatMessage[];
  reminders: Array<{ id: string; text: string; fireAt: string }>;
};

type AiBinding = {
  run: (model: string, input: { messages: Array<{ role: string; content: string }> }) => Promise<{ response?: string }>;
};

type Env = {
  AI?: AiBinding;
};

export class AistroykaFieldAgent extends Agent<Env, AgentState> {
  initialState: AgentState = {
    messages: [],
    reminders: [],
  };

  onStateChanged(_state: AgentState, _source: Connection | "server") {
    // Hook kept intentionally lightweight; state sync is automatic.
  }

  async onConnect(connection: Connection) {
    connection.send(
      JSON.stringify({
        type: "welcome",
        messageCount: this.state.messages.length,
      }),
    );
  }

  async onMessage(connection: Connection, rawMessage: string) {
    const parsed = this.safeJsonParse(rawMessage);
    if (!parsed || typeof parsed !== "object") {
      connection.send(JSON.stringify({ type: "error", message: "Invalid payload" }));
      return;
    }

    if (parsed.type === "chat" && typeof parsed.content === "string") {
      const content = parsed.content.trim();
      if (!content) {
        connection.send(JSON.stringify({ type: "error", message: "Message is empty" }));
        return;
      }
      const answer = await this.runAssistant(content);
      connection.send(JSON.stringify({ type: "chat_response", content: answer }));
      return;
    }

    if (parsed.type === "schedule_reminder" && typeof parsed.text === "string" && typeof parsed.delaySeconds === "number") {
      const delaySeconds = Math.max(5, Math.min(parsed.delaySeconds, 86400));
      const fireAt = new Date(Date.now() + delaySeconds * 1000);
      const id = crypto.randomUUID();
      await this.schedule(delaySeconds, "sendReminder", { id, text: parsed.text, fireAt: fireAt.toISOString() });
      this.setState({
        ...this.state,
        reminders: [...this.state.reminders, { id, text: parsed.text, fireAt: fireAt.toISOString() }],
      });
      connection.send(JSON.stringify({ type: "scheduled", id, fireAt: fireAt.toISOString() }));
      return;
    }

    connection.send(JSON.stringify({ type: "error", message: "Unsupported message type" }));
  }

  @unstable_callable()
  async chat(message: string) {
    const content = message.trim();
    if (!content) return "Message is empty";
    return this.runAssistant(content);
  }

  async sendReminder(payload: { id: string; text: string; fireAt: string }) {
    const reminders = this.state.reminders.filter((r) => r.id !== payload.id);
    this.setState({ ...this.state, reminders });
  }

  private async runAssistant(userMessage: string): Promise<string> {
    const now = new Date().toISOString();
    const nextMessages: ChatMessage[] = [
      ...this.state.messages,
      { role: "user", content: userMessage, at: now },
    ];

    const env = (this as unknown as { env?: Env }).env;
    let assistantText = `Received: ${userMessage}`;
    if (env?.AI) {
      try {
        const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        });
        assistantText = response.response?.trim() || "No response from model.";
      } catch {
        assistantText = "AI request failed. Message stored in state.";
      }
    }

    this.setState({
      ...this.state,
      messages: [...nextMessages, { role: "assistant", content: assistantText, at: new Date().toISOString() }],
    });

    return assistantText;
  }

  private safeJsonParse(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}
