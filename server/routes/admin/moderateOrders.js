const express = require("express");
const router = express.Router();
const pool = require("../../config/database");
const transporter = require("../../config/emailTransporter");


// GET all orders
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM orders ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Could not fetch orders" });
  }
});

// PUT update status
router.put("/:orderId/status", async (req, res) => {
    const { orderId } = req.params;
    const { newStatus } = req.body;
  
    const allowedStatuses = ['pending', 'shipped', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
  
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
  
      // Update order
      await client.query(
        "UPDATE orders SET status = $1 WHERE order_id = $2",
        [newStatus, orderId]
      );
  
      // Get user email and name
      const userResult = await client.query(`
        SELECT o.status, o.order_id, o.total_due, o.paid_amount,
               a.email, a.first_name
        FROM orders o
        JOIN accounts a ON o.buyer_id = a.user_id
        WHERE o.order_id = $1
      `, [orderId]);
  
      if (userResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Order or user not found" });
      }
  
      const { email, first_name, total_due, paid_amount } = userResult.rows[0];
  
      await client.query("COMMIT");
  
      // Send email
      await transporter.sendMail({
        from: "support@craftcircle.com",
        to: email,
        subject: `Your order #${orderId} status has been updated`,
        html: `
          <p>Hi <strong>${first_name}</strong>,</p>
          <p>The status of your order <strong>#${orderId}</strong> has been updated to <strong>${newStatus.toUpperCase()}</strong>.</p>
          <ul>
            <li><strong>Total Due:</strong> €${total_due}</li>
            <li><strong>Paid:</strong> €${paid_amount}</li>
          </ul>
          <p>Thank you for shopping with us!</p>
          <p>Best regards,<br/>CraftCircle Team</p>
        `
      });
  
      console.log("Status update email sent.");
      res.json({ message: "Order status updated and email sent." });
  
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error updating order status:", err);
      res.status(500).json({ error: "Failed to update order status" });
    } finally {
      client.release();
    }
  });
  
module.exports = router;
