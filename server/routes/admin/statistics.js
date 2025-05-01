const express = require("express");
const router = express.Router();
const pool = require("../../config/database");

router.get("/overview", async (req, res) => {
  try {
    const accounts = await pool.query("SELECT COUNT(*) FROM accounts");
    const posts = await pool.query("SELECT COUNT(*) FROM posts");
    const marketplace_items = await pool.query("SELECT COUNT(*) FROM marketplace_items");
    const categories = await pool.query("SELECT COUNT(*) FROM categories");

    res.json({
      userCount: accounts.rows[0].count,
      postCount: posts.rows[0].count,
      productCount: marketplace_items.rows[0].count,
      categoryCount: categories.rows[0].count,
    });
  } catch (err) {
    console.error("Error fetching statistics:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
