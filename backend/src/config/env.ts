function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  jwtSecret: required("JWT_SECRET"),
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  isProduction: process.env.NODE_ENV === "production",
  // Independent of NODE_ENV so a production deploy can run over plain HTTP
  // (e.g. before DNS/SSL are in place) without browsers silently dropping the cookie.
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production",
  ai: aiConfig(),
};

// Optional AI provider settings. Works with an OpenRouter key (sk-or-...) or
// an OpenAI key. AI features return an error when no key is set.
function aiConfig() {
  const apiKey = (process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY ?? "").trim();
  const isOpenRouter = apiKey.startsWith("sk-or-");
  // Comma-separated; OpenRouter tries them in order if one is busy.
  const defaultModels = isOpenRouter
    ? "google/gemma-4-31b-it:free,nvidia/nemotron-3-ultra-550b-a55b:free,openrouter/free"
    : "gpt-4o-mini";
  return {
    apiKey,
    isOpenRouter,
    baseUrl: process.env.AI_BASE_URL ?? (isOpenRouter ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1"),
    models: (process.env.AI_MODEL ?? defaultModels).split(",").map((m) => m.trim()).filter(Boolean),
  };
}
