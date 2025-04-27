const express = require("express");
const router = express.Router();
const pool = require("../config/database");

async function addAppreciationNotification({ user_id, sender_id, type, post_id = null, io = null }) {
    try {
      // 1. Verificăm dacă există deja o notificare nevăzută identică
      const existing = await pool.query(
        `SELECT * FROM appreciation_notifications
         WHERE user_id = $1 AND sender_id = $2 AND type = $3 AND post_id = $4 AND seen = false`,
        [user_id, sender_id, type, post_id]
      );
  
      if (existing.rows.length > 0) {
        console.log("🚫 Notification already exists and is unseen. Skipping insert.");
      } else {
        // 2. Dacă NU există, o inserăm
        await pool.query(
          `INSERT INTO appreciation_notifications (user_id, sender_id, type, post_id)
           VALUES ($1, $2, $3, $4)`,
          [user_id, sender_id, type, post_id]
        );
        console.log("✅ Inserted new appreciation notification.");
      }
  
      // 3. Emitem socket-ul ORICUM, pentru a arăta vizual notificarea
      if (io) {
        const userResult = await pool.query(
          `SELECT first_name, last_name, profile_picture FROM accounts WHERE user_id = $1`,
          [sender_id]
        );
  
        console.log("📦 Emitting appreciation socket event to user:", user_id);
  
        io.to(`user-${user_id}`).emit("new_appreciation", {
          type,
          sender_id,
          post_id,
          created_at: new Date(),
          sender_first_name: userResult.rows[0].first_name,
          sender_last_name: userResult.rows[0].last_name,
          sender_avatar: userResult.rows[0].profile_picture
        });
      } else {
        console.log("⚠️ No io instance available to emit appreciation event.");
      }
    } catch (err) {
      console.error("❌ Error inserting appreciation notification:", err);
      throw err;
    }
  }
  
module.exports.addAppreciationNotification = addAppreciationNotification;


router.get("/", async (req, res) => {
    const userId = parseInt(req.query.user_id, 10);
    if (!userId) {
        return res.status(400).json({ error: "Missing user_id" });
      }
    try {
        const result = await pool.query(
        `SELECT an.*, u.first_name, u.last_name, u.profile_picture
        FROM appreciation_notifications an
        JOIN accounts u ON an.sender_id = u.user_id
        WHERE an.user_id = $1
        ORDER BY an.created_at DESC
        LIMIT 30`,
        [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching appreciation notifications:", err);
        res.status(500).json({ error: "Eroare server" });
    }
});


router.get("/unseen-count", async (req, res) => {
    const userId = parseInt(req.query.user_id, 10);
    if (!userId) {
        return res.status(400).json({ error: "Missing user_id" });
      }
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
    if (!userId) {
        return res.status(400).json({ error: "Missing user_id" });
      }
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

module.exports.router = router;
