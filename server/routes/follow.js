const express = require("express");
const router = express.Router();
const pool = require("../config/database");


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

// follow
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
      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Eroare la urmărire" });
    }
  });
  

// unfollow
router.delete("/", async (req, res) => {
  const { follower_id, following_id } = req.body;
  try {
    await pool.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [follower_id, following_id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la oprirea urmăririi" });
  }
});

module.exports = router;
