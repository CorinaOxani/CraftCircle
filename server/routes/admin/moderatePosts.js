const express = require("express");
const pool = require("../../config/database");
const router = express.Router();
const nodemailer = require("nodemailer");

// === CONFIGURARE EMAIL ===
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "oxanicorina0@gmail.com",
    pass: "zssj zxlz jaok bcpw",
  },
});


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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Obține informațiile postării
    const postInfo = await client.query(`
      SELECT 
        p.content, a.email, a.first_name,
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

    //  Șterge postarea
    await client.query("DELETE FROM posts WHERE post_id = $1", [postId]);

    await client.query("COMMIT");

    // Trimite email
    try {
      await transporter.sendMail({
        from: "youremail@gmail.com",
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
      
    } catch (mailErr) {
      console.warn("Post deleted but failed to send email:", mailErr);
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
