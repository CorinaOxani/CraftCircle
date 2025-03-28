const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.get("/user-cart/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const cartItems = await pool.query(
      `SELECT 
         c.cart_id, c.user_id, c.item_id, c.seller_id, c.quantity, c.added_at,
         m.title, m.description, m.price,
         u.first_name || ' ' || u.last_name AS seller_name,
         i.image_url
       FROM shopping_cart c
       JOIN marketplace_items m ON c.item_id = m.item_id
       JOIN accounts u ON c.seller_id = u.user_id
       LEFT JOIN LATERAL (
         SELECT image_url FROM shop_item_images WHERE item_id = c.item_id LIMIT 1
       ) i ON true
       WHERE c.user_id = $1
       ORDER BY u.last_name, u.first_name, c.added_at DESC`,
      [userId]
    );

    res.json(cartItems.rows);
  } catch (err) {
    console.error("Error loading user cart:", err);
    res.status(500).json({ error: "Failed to load cart" });
  }
});


router.put("/update-quantity", async (req, res) => {
    const { cart_id, quantity } = req.body;
  
    try {
      await pool.query(
        "UPDATE shopping_cart SET quantity = $1 WHERE cart_id = $2",
        [quantity, cart_id]
      );
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error updating quantity:", err);
      res.status(500).json({ error: "Failed to update quantity" });
    }
  });
  
router.delete("/delete/:cartId", async (req, res) => {
    const { cartId } = req.params;
  
    try {
      await pool.query("DELETE FROM shopping_cart WHERE cart_id = $1", [cartId]);
      res.sendStatus(200);
    } catch (err) {
      console.error("Error deleting cart item:", err);
      res.status(500).json({ error: "Failed to delete cart item" });
    }
  });
  

module.exports = router;
