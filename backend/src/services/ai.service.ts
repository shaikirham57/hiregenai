import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const TIMEOUT_MS = 60_000;

/** Sends a chat request to the configured AI provider and returns the reply text. */
export async function chatCompletion(messages: ChatMessage[], maxTokens = 4000): Promise<string> {
  const { apiKey, isOpenRouter, baseUrl, models } = env.ai;
  if (!apiKey) throw new HttpError(503, "AI is not set up. Add OPENROUTER_API_KEY to the server settings.");

  const body = isOpenRouter
    ? // Some free models "think" before answering; keep that short so the answer fits.
      { models, messages, max_tokens: maxTokens, reasoning: { effort: "low", exclude: true } }
    : { model: models[0], messages, max_tokens: maxTokens };

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(isOpenRouter ? { "X-Title": "HireGen AI" } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    console.error("AI request failed:", err);
    throw new HttpError(504, "The AI service took too long to respond. Please try again.");
  }

  // OpenRouter may send whitespace before the JSON while it waits for a model.
  const raw = (await res.text()).trim();
  let data: { choices?: { message?: { content?: string }; finish_reason?: string }[]; error?: { message?: string } } = {};
  try {
    data = JSON.parse(raw);
  } catch {
    // handled below
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  const cutOff = data.choices?.[0]?.finish_reason === "length";
  if (!res.ok || !text || cutOff) {
    console.error("AI provider error:", res.status, data.error?.message ?? raw.slice(0, 300));
    const busy = res.status === 429 || /rate.?limit/i.test(data.error?.message ?? "");
    throw new HttpError(
      502,
      busy ? "The AI service is busy or the daily limit was reached. Please try again later." : "The AI service could not generate a response. Please try again."
    );
  }
  return text;
}
