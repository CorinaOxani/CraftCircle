const express = require("express");
const pool = require("../../config/database");
const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT 
        p.post_id,
        p.user_id,
        a.first_name || ' ' || a.last_name AS username,
        a.profile_picture,
        p.content,
        p.created_at,
        COALESCE(like_counts.like_count, 0) AS like_count,
        COALESCE(report_counts.report_count, 0) AS report_count,
        COALESCE(json_agg(DISTINCT pm.file_url) FILTER (WHERE pm.file_url IS NOT NULL), '[]') AS media_urls
        FROM posts p
        JOIN accounts a ON p.user_id = a.user_id
        LEFT JOIN post_media pm ON p.post_id = pm.post_id
        LEFT JOIN (
        SELECT post_id, COUNT(*) AS like_count
        FROM likes
        GROUP BY post_id
        ) AS like_counts ON p.post_id = like_counts.post_id
        LEFT JOIN (
        SELECT post_id, COUNT(*) AS report_count
        FROM post_reports
        GROUP BY post_id
        ) AS report_counts ON p.post_id = report_counts.post_id
        GROUP BY p.post_id, a.user_id, like_counts.like_count, report_counts.report_count
        ORDER BY 
        COALESCE(report_counts.report_count, 0) DESC,
        p.created_at DESC;

    `);

    res.json(result.rows || []);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/delete-post/:postId", async (req, res) => {
    const { postId } = req.params;
    try {
      await pool.query("DELETE FROM posts WHERE post_id = $1", [postId]);
      res.json({ message: "Post deleted successfully" });
    } catch (err) {
      console.error("Error deleting post:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/delete-user/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      await pool.query("DELETE FROM accounts WHERE user_id = $1", [userId]);
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
   
  module.exports = router;
