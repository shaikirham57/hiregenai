import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { serializeNotification } from "../lib/serialize.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const notificationsRouter = Router();

const roleSchema = z.enum(["recruiter", "candidate"]);

notificationsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const role = roleSchema.parse(req.query.role);
    const notifications = await prisma.notification.findMany({ where: { role }, orderBy: { createdAt: "desc" } });
    res.json(notifications.map(serializeNotification));
  })
);

notificationsRouter.patch(
  "/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.status(204).end();
  })
);

notificationsRouter.post(
  "/mark-all-read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const role = roleSchema.parse(req.body?.role);
    await prisma.notification.updateMany({ where: { role }, data: { read: true } });
    res.status(204).end();
  })
);
