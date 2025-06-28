const express = require("express");
const pool = require("../config/database");
const router = express.Router();
const transporter = require("../config/emailTransporter");

// Salvează comanda și trimite email de confirmare
router.post("/", async (req, res) => {
  const {
    buyer_id,
    seller_id,
    item_id,
    status,
    payment_method,
    paid_amount,
    total_due,
    country,
    city,
    state,
    zip_code,
    street,
    address_details,
  } = req.body;

  try {
    const buyerId = parseInt(buyer_id);
    const sellerId = parseInt(seller_id);
    const itemId = parseInt(item_id);
    const paidAmount = parseFloat(paid_amount);
    const totalDue = parseFloat(total_due);

    if (
      isNaN(buyerId) || isNaN(sellerId) || isNaN(itemId) ||
      isNaN(paidAmount) || isNaN(totalDue)
    ) {
      return res.status(400).json({ error: "Missing or invalid numeric values." });
    }

    const result = await pool.query(
      `INSERT INTO orders (
        buyer_id, seller_id, item_id, status,
        created_at, payment_method, paid_amount, total_due,
        country, city, state, zip_code, street, address_details
      ) VALUES (
        $1, $2, $3, $4,
        NOW(), $5, $6, $7,
        $8, $9, $10, $11, $12, $13
      ) RETURNING *`,
      [
        buyerId, sellerId, itemId, status,
        payment_method, paidAmount, totalDue,
        country, city, state, zip_code, street, address_details
      ]
    );

    // După ce comanda a fost adăugată, trimitem email
    const userResult = await pool.query(
      "SELECT email, first_name FROM accounts WHERE user_id = $1",
      [buyerId] 
    );

    if (userResult.rows.length > 0) {
      const { email, first_name } = userResult.rows[0];

      const mailOptions = {
        from: "oxanicorina0@gmail.com",
        to: email,
        subject: "Order Confirmation - CraftCircle",
        html: `<p>Hi ${first_name},</p>
               <p>Your order has been placed successfully. Thank you for shopping with us!</p>
               <p>We'll notify you once it's shipped.</p>
               <br/>
               <p>CraftCircle Team</p>`
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting order or sending email:", err);
    res.status(500).json({ error: "Failed to create order or send confirmation" });
  }
});

router.get('/user/:user_id', async (req, res) => {
  const userId = parseInt(req.params.user_id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID in URL." });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching user orders");
  }
});


module.exports = router;
