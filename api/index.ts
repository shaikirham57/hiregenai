import { app } from "../server/src/app.js";

// Vercel's Node.js runtime accepts any (req, res) => void handler — an Express
// app instance satisfies that directly, so no adapter is needed. vercel.json
// rewrites every /api/* request to this single function, and Express does its
// own routing on the original path (same as the persistent local/VPS server).
// A file-based catch-all ([...path].ts) only matches one path segment outside
// Next.js, which made nested routes like /api/auth/login return 404.
export default app;
