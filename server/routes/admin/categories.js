const express = require("express");
const router = express.Router();
const pool = require("../../config/database");


router.get("/getCategories", async (req, res) => {
  try {
    const categoriesWithCounts = await pool.query(`
      SELECT 
        c.category_id,
        c.name,
        c.description,
        COUNT(DISTINCT p.post_id) AS post_count,
        COUNT(DISTINCT i.item_id) AS product_count
      FROM categories c
      LEFT JOIN posts p ON p.category_id = c.category_id
      LEFT JOIN marketplace_items i ON i.category_id = c.category_id
      GROUP BY c.category_id, c.name, c.description
      ORDER BY c.name ASC;
    `);
    res.json(Array.isArray(categoriesWithCounts.rows) ? categoriesWithCounts.rows : []);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/add", async (req, res) => {
  const { name, description } = req.body;
  //console.log("Received:", req.body);

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const newCategory = await pool.query(
      `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *`,
      [name.trim(), description || null]
    );
    res.status(201).json(newCategory.rows[0]);
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// În routes/admin/categories.js
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM categories WHERE category_id = $1",
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete category:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
