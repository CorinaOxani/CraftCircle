const express = require("express");
const pool = require("../../config/database");
const router = express.Router();
const transporter = require("../../config/emailTransporter");

// Fetch all posts
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

// Delete a post and update admin stats
router.delete("/delete-post/:postId", async (req, res) => {
  const { postId } = req.params;
  const adminId = req.query.admin_id || 1;  // Admin ID, use session or token in production
  const client = await pool.connect();

  try {
      await client.query("BEGIN");

      // Get post info
      const postInfo = await client.query(`
          SELECT 
              p.content, 
              a.email, 
              a.first_name,
              (SELECT file_url FROM post_media WHERE post_id = p.post_id LIMIT 1) AS image_url
          FROM posts p
          JOIN accounts a ON p.user_id = a.user_id
          WHERE p.post_id = $1
      `, [postId]);
      
      if (postInfo.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Post not found" });
      }

      const { content, email, first_name, image_url } = postInfo.rows[0];

      // Delete post likes
      await client.query("DELETE FROM likes WHERE post_id = $1", [postId]);

      // Delete post
      await client.query("DELETE FROM posts WHERE post_id = $1", [postId]);

      // Update admin stats
      await client.query(`
          UPDATE admins
          SET deleted_posts = deleted_posts + 1
          WHERE admin_id = $1
      `, [adminId]);

      await client.query("COMMIT");

      // Send notification email
      try {
          await transporter.sendMail({
              from: "oxanicorina0@gmail.com",
              to: email,
              subject: "Your post has been removed by the admin",
              html: `
                  <p>Hi <strong>${first_name}</strong>,</p>
                  <p>Your post has been removed by an administrator, due to reports by other users.</p>
              
                  <p><strong>Content of the post:</strong></p>
                  <blockquote style="border-left: 4px solid #ccc; margin: 10px 0; padding-left: 10px;">
                      ${content}
                  </blockquote>
              
                  ${image_url ? `<p><strong>Image:</strong><br/><img src="${image_url}" alt="Post image" style="max-width: 400px; border: 1px solid #ddd;"/></p>` : ""}
              
                  <p>Best regards,<br/>Moderation Team</p>
              `
          });
          console.log("Email sent successfully.");
      } catch (mailErr) {
          console.warn("Failed to send email:", mailErr);
      }

      res.json({ message: "Post deleted and email sent" });
  } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error deleting post:", err);
      res.status(500).json({ error: "Internal server error" });
  } finally {
      client.release();
  }
});

// Fetch post reports
router.get("/reports/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const result = await pool.query(`
      SELECT a.user_id, a.first_name, a.last_name, a.profile_picture
      FROM post_reports pr
      JOIN accounts a ON pr.user_id = a.user_id
      WHERE pr.post_id = $1
    `, [postId]);

    res.json(result.rows || []);
  } catch (err) {
    console.error("Error fetching report users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
