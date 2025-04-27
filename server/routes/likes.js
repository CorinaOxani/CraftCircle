const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { addAppreciationNotification } = require("./appreciationNotification.js");

// Adaugă like
router.post("/add", async (req, res) => {
  const { user_id, post_id } = req.body;

  if (!user_id || !post_id) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const exists = await pool.query(
      "SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2",
      [user_id, post_id]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Already liked" });
    }

    await pool.query(
      "INSERT INTO likes (user_id, post_id, created_at) VALUES ($1, $2, NOW())",
      [user_id, post_id]
    );


    const postOwnerResult = await pool.query(
      "SELECT user_id FROM posts WHERE post_id = $1",
      [post_id]
    );

    if (postOwnerResult.rows.length > 0) {
      const postOwnerId = postOwnerResult.rows[0].user_id;


      if (postOwnerId !== user_id) {
        await addAppreciationNotification({
          user_id: postOwnerId,    
          sender_id: user_id,       
          type: "like",
          post_id: post_id,
          io: req.io               
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error adding like:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sterge like
router.post("/remove", async (req, res) => {
  const { user_id, post_id } = req.body;

  if (!user_id || !post_id) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    await pool.query(
      "DELETE FROM likes WHERE user_id = $1 AND post_id = $2",
      [user_id, post_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error removing like:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/:post_id/:user_id", async (req, res) => {
  const { post_id, user_id } = req.params;

  try {
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM likes WHERE post_id = $1",
      [post_id]
    );

    const likedResult = await pool.query(
      "SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2",
      [post_id, user_id]
    );

    res.json({
      totalLikes: parseInt(countResult.rows[0].count, 10),
      userLiked: likedResult.rows.length > 0,
    });
  } catch (err) {
    console.error("Error fetching like status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


  

module.exports = router;
