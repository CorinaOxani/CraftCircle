const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// GET /discover/posts?user_id=xx&filter=recent|popular
router.get("/posts", async (req, res) => {
    const userId = parseInt(req.query.user_id, 10);
    const search = req.query.search?.toLowerCase() || "";
    const categoryId = req.query.category_id;
  
    if (!userId) return res.status(400).json({ error: "Missing user_id" });
  
    try {
      let query = `
        SELECT 
          p.post_id,
          p.user_id,
          p.content,
          p.created_at,
          p.category_id,
          u.first_name,
          u.last_name,
          u.profile_picture
        FROM follows f
        JOIN posts p ON p.user_id = f.following_id
        JOIN accounts u ON u.user_id = p.user_id
        WHERE f.follower_id = $1
      `;
  
      const values = [userId];
      
      if (search) {
        query += ` AND (
          LOWER(p.content) LIKE $${values.length + 1}
          OR LOWER(u.first_name || ' ' || u.last_name) LIKE $${values.length + 1}
        )`;
        values.push(`%${search}%`);
      }
  
      // Cu:
const categoryName = req.query.category?.toLowerCase();
if (categoryName) {
  query += ` AND EXISTS (
    SELECT 1 FROM categories c
    WHERE c.category_id = p.category_id
      AND LOWER(c.name) LIKE $${values.length + 1}
  )`;
  values.push(`%${categoryName}%`);
}
  
      query += ` ORDER BY p.created_at DESC LIMIT 50`;
  
      const postsResult = await pool.query(query, values);
      const posts = postsResult.rows;
  
      const enrichedPosts = await Promise.all(
        posts.map(async (post) => {
          const mediaResult = await pool.query(
            `SELECT file_url, file_type FROM post_media WHERE post_id = $1 ORDER BY media_id ASC`,
            [post.post_id]
          );
  
          return {
            ...post,
            media_urls: mediaResult.rows.map(row => ({
              url: row.file_url,
              type: row.file_type
            }))
          };
        })
      );
  
      res.json(enrichedPosts);
    } catch (err) {
      console.error("Error fetching discover posts:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  router.get("/categories", async (req, res) => {
    try {
      const result = await pool.query("SELECT category_id, name FROM categories ORDER BY name ASC");
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
module.exports = router;
