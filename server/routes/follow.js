const express = require("express");
const pool = require("../config/database");
const { addAppreciationNotification } = require("./appreciationNotification");

module.exports = (io) => {
  const router = express.Router();

  // Verificare follow
  router.get("/check", async (req, res) => {
    const { follower_id, following_id } = req.query;
    try {
      const result = await pool.query(
        `SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2`,
        [follower_id, following_id]
      );
      res.json({ isFollowing: result.rowCount > 0 });
    } catch (err) {
      console.error("Follow check error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // FOLLOW
  router.post("/", async (req, res) => {
    const { follower_id, following_id } = req.body;

    console.log("Received follow request:", follower_id, "->", following_id);
    try {
      await pool.query(
        `INSERT INTO follows (follower_id, following_id, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT DO NOTHING`,
        [follower_id, following_id]
      );

      // Trimitere notificare de tip "follow"
      await addAppreciationNotification({
        user_id: following_id,
        sender_id: follower_id,
        type: "follow",
        io,
      });

      res.sendStatus(200);
    } catch (err) {
      console.error("Follow error:", err);
      res.status(500).json({ error: "Follow failed" });
    }
  });

  // UNFOLLOW
  router.delete("/", async (req, res) => {
    const { follower_id, following_id } = req.body;
    try {
      await pool.query(
        "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
        [follower_id, following_id]
      );
      res.sendStatus(200);
    } catch (err) {
      console.error("Unfollow error:", err);
      res.status(500).json({ error: "Unfollow failed" });
    }
  });

  // Get Followers
  router.get("/followers/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const result = await pool.query(
        `SELECT a.user_id, a.first_name, a.last_name, a.profile_picture
         FROM follows f
         JOIN accounts a ON a.user_id = f.follower_id
         WHERE f.following_id = $1`,
        [userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching followers:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get Following
  router.get("/following/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const result = await pool.query(
        `SELECT a.user_id, a.first_name, a.last_name, a.profile_picture
         FROM follows f
         JOIN accounts a ON a.user_id = f.following_id
         WHERE f.follower_id = $1`,
        [userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching following:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};
