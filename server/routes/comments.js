const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// GET comments
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;
  const result = await pool.query(
    `SELECT 
  c.id, 
  c.text, 
  c.user_id, 
  a.first_name || ' ' || a.last_name AS username, 
  a.profile_picture,
  c.created_at::text AS created_at
FROM comments c
JOIN accounts a ON c.user_id = a.user_id
WHERE c.post_id = $1
ORDER BY c.created_at ASC
`,
    [postId]
  );
  res.json(result.rows);
});

// POST comment
router.post("/:postId", async (req, res) => {
  const { postId } = req.params;
  const { text, user_id } = req.body;

  if (!text || !user_id) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const insert = await pool.query(
      `INSERT INTO comments (post_id, user_id, text) VALUES ($1, $2, $3) RETURNING *`,
      [postId, user_id, text]
    );

    const user = await pool.query(
      `SELECT first_name || ' ' || last_name AS username, profile_picture
       FROM accounts
       WHERE user_id = $1`,
      [user_id]
    );

    res.json({
      ...insert.rows[0],
      username: user.rows[0].username,
      profile_picture: user.rows[0].profile_picture,
    });
  } catch (err) {
    console.error("Error inserting comment:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

module.exports = router;
