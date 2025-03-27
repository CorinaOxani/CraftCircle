const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Obține cart-ul complet pentru un user, inclusiv info produs, imagine și numele vânzătorului
router.get("/user-cart/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const cartItems = await pool.query(
      `SELECT 
         c.cart_id, c.user_id, c.item_id, c.seller_id, c.quantity, c.added_at,
         m.title, m.description, m.price,
         u.first_name AS seller_name,
         i.image_url
       FROM shopping_cart c
       JOIN marketplace_items m ON c.item_id = m.item_id
       JOIN users u ON c.seller_id = u.user_id
       LEFT JOIN LATERAL (
         SELECT image_url FROM shop_item_images WHERE item_id = c.item_id LIMIT 1
       ) i ON true
       WHERE c.user_id = $1
       ORDER BY u.first_name, c.added_at DESC`,
      [userId]
    );

    res.json(cartItems.rows);
  } catch (err) {
    console.error("Error loading user cart:", err);
    res.status(500).json({ error: "Failed to load cart" });
  }
});

module.exports = router;
