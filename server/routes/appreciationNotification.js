const express = require("express");
const router = express.Router();
const pool = require("../config/database");


async function addAppreciationNotification({ user_id, sender_id, type, post_id = null, io = null }) {
  try {
    const existingNotif = await pool.query(
      `SELECT id, created_at FROM appreciation_notifications
       WHERE user_id = $1 AND sender_id = $2 AND type = $3 AND post_id = $4
       ORDER BY created_at DESC
       LIMIT 1`,
      [user_id, sender_id, type, post_id]
    );

    let notificationId;
    const now = new Date();

    if (existingNotif.rows.length > 0) {
      const existing = existingNotif.rows[0];
      const existingDate = new Date(existing.created_at);
      const diffInMinutes = (now - existingDate) / (1000 * 60);

      if (diffInMinutes < 60) {
        notificationId = existing.id;
        await pool.query(
          `UPDATE appreciation_notifications
           SET created_at = NOW(), seen = false
           WHERE id = $1`,
          [notificationId]
        );
        console.log("Updated recent appreciation notification:", notificationId);
      } else {
        await pool.query(`DELETE FROM appreciation_notifications WHERE id = $1`, [existing.id]);
        const insertResult = await pool.query(
          `INSERT INTO appreciation_notifications (user_id, sender_id, type, post_id)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [user_id, sender_id, type, post_id]
        );
        notificationId = insertResult.rows[0].id;
        console.log("Deleted old and inserted new appreciation notification:", notificationId);
      }
    } else {
      const insertResult = await pool.query(
        `INSERT INTO appreciation_notifications (user_id, sender_id, type, post_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [user_id, sender_id, type, post_id]
      );
      notificationId = insertResult.rows[0].id;
      console.log("Inserted new appreciation notification:", notificationId);
    }

    if (io) {
      const userResult = await pool.query(
        `SELECT first_name, last_name, profile_picture FROM accounts WHERE user_id = $1`,
        [sender_id]
      );

      io.to(`user-${user_id}`).emit("new_appreciation", {
        type,
        sender_id,
        post_id,
        created_at: now,
        sender_first_name: userResult.rows[0].first_name,
        sender_last_name: userResult.rows[0].last_name,
        sender_avatar: userResult.rows[0].profile_picture,
      });
    }
  } catch (err) {
    console.error("Error handling appreciation notification:", err);
    throw err;
  }
}

router.get("/unseen-count", async (req, res) => {
  const userId = parseInt(req.query.user_id, 10);
  if (!userId) return res.status(400).json({ error: "Missing user_id" });

  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM appreciation_notifications
       WHERE user_id = $1 AND seen = false`,
      [userId]
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching unseen count:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

router.post("/mark-as-seen", async (req, res) => {
  const userId = parseInt(req.query.user_id, 10);
  if (!userId) return res.status(400).json({ error: "Missing user_id" });

  try {
    await pool.query(
      `UPDATE appreciation_notifications
       SET seen = true
       WHERE user_id = $1 AND seen = false`,
      [userId]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error("Error marking notifications as seen:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

router.get("/list", async (req, res) => {
  const userIdRaw = req.query.user_id;

  const userId = Number(userIdRaw);
  if (!userIdRaw || isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const result = await pool.query(
        `SELECT 
        an.*, 
        u.first_name, 
        u.last_name, 
        u.profile_picture,
        post_img.file_url AS post_image_url
        FROM appreciation_notifications an
        JOIN accounts u ON an.sender_id = u.user_id
        LEFT JOIN LATERAL (
        SELECT pm.file_url
        FROM post_media pm
        WHERE pm.post_id = an.post_id AND pm.file_type = 'image'
        ORDER BY pm.media_id ASC
        LIMIT 1
        ) AS post_img ON true
        WHERE an.user_id = $1
        ORDER BY an.created_at DESC
        LIMIT 30
    `,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching appreciation notifications:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

module.exports = {
  router,
  addAppreciationNotification,
};
