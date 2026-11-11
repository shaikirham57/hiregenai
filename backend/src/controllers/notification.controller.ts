import { prisma } from "../config/database.js";
import { serializeNotification } from "../utils/serializers.js";
import { asyncHandler } from "../utils/http.js";
import { roleSchema } from "../validators/common.schemas.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const role = roleSchema.parse(req.query.role);
  const notifications = await prisma.notification.findMany({ where: { role }, orderBy: { createdAt: "desc" } });
  res.json(notifications.map(serializeNotification));
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
  res.status(204).end();
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const role = roleSchema.parse(req.body?.role);
  await prisma.notification.updateMany({ where: { role }, data: { read: true } });
  res.status(204).end();
});
