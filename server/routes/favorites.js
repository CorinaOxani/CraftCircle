const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Obține toate favoritele unui utilizator
router.get("/user-favorites/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
         f.favorite_id, f.user_id, f.item_id, f.seller_id, f.added_at,
         m.title, m.description, m.price,
         u.first_name || ' ' || u.last_name AS seller_name,
         i.image_url
       FROM favorites f
       JOIN marketplace_items m ON f.item_id = m.item_id
       JOIN accounts u ON f.seller_id = u.user_id
       LEFT JOIN LATERAL (
         SELECT image_url FROM shop_item_images WHERE item_id = f.item_id LIMIT 1
       ) i ON true
       WHERE f.user_id = $1
       ORDER BY u.last_name, u.first_name, f.added_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error loading favorites:", err);
    res.status(500).json({ error: "Failed to load favorites" });
  }
});

// Adaugă un produs la favorite
router.post("/add", async (req, res) => {
  const { user_id, item_id, seller_id } = req.body;

  try {
    // Verifică dacă există deja în favorite
    const exists = await pool.query(
      "SELECT 1 FROM favorites WHERE user_id = $1 AND item_id = $2",
      [user_id, item_id]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Already in favorites" });
    }

    await pool.query(
      `INSERT INTO favorites (user_id, item_id, seller_id, added_at)
       VALUES ($1, $2, $3, NOW())`,
      [user_id, item_id, seller_id]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error adding to favorites:", err);
    res.status(500).json({ error: "Failed to add to favorites" });
  }
});

// Șterge un produs din favorite
router.delete("/delete/:favoriteId", async (req, res) => {
  const { favoriteId } = req.params;

  try {
    await pool.query("DELETE FROM favorites WHERE favorite_id = $1", [favoriteId]);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error deleting favorite:", err);
    res.status(500).json({ error: "Failed to delete favorite" });
  }
});

module.exports = router;
