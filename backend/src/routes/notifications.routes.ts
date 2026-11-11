import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notification.controller.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, listNotifications);
notificationsRouter.patch("/:id/read", requireAuth, markNotificationRead);
notificationsRouter.post("/mark-all-read", requireAuth, markAllNotificationsRead);
