import { asyncHandler } from "../utils/http.js";
import { getAnalyticsSummary } from "../services/analytics.service.js";

export const getAnalytics = asyncHandler(async (_req, res) => {
  res.json(await getAnalyticsSummary());
});
