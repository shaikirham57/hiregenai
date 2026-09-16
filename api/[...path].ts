import { app } from "../server/src/app.js";

// Vercel's Node.js runtime accepts any (req, res) => void handler — an Express
// app instance satisfies that directly, so no adapter is needed. This single
// catch-all function serves every /api/* route (Express does its own routing
// internally, same as the persistent server used for local/VPS deployment).
export default app;
