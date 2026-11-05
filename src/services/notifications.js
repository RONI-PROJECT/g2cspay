import { sql, all, one } from '../db/index.js';

export async function createNotification(userId, type, title, message, meta = {}) {
   try {
      const now = new Date().toISOString();
      await sql(
         `INSERT INTO notifications ("userId", type, title, message, meta, "isRead", "createdAt")
          VALUES ($1, $2, $3, $4, $5, false, $6)`,
         [userId, type, title, message, JSON.stringify(meta), now],
      );
   } catch (e) {
      console.error('[notif] gagal:', e.message);
   }
}

export async function listNotifications(userId, limit = 30) {
   return all(
      `SELECT id, type, title, message, meta, "isRead", "createdAt"
       FROM notifications
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2`,
      [userId, limit],
   );
}

export async function unreadCount(userId) {
   const row = await one(
      `SELECT COUNT(*) AS n FROM notifications WHERE "userId" = $1 AND "isRead" = false`,
      [userId],
   );
   return Number(row?.n || 0);
}

export async function markAllRead(userId) {
   await sql(`UPDATE notifications SET "isRead" = true WHERE "userId" = $1`, [userId]);
}

export async function clearAll(userId) {
   await sql(`DELETE FROM notifications WHERE "userId" = $1`, [userId]);
}
