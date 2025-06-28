const express = require("express");
const pool = require("../../config/database");
const router = express.Router();
const transporter = require("../../config/emailTransporter");

// Fetch all products
router.get("/all", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                m.item_id,
                m.user_id,
                u.first_name || ' ' || u.last_name AS username,
                m.title,
                m.description,
                m.price,
                m.created_at,
                m.stock,
                COALESCE(r.report_count, 0) AS report_count,
                COALESCE(json_agg(DISTINCT i.image_url) FILTER (WHERE i.image_url IS NOT NULL), '[]') AS media_urls
            FROM marketplace_items m
            JOIN accounts u ON m.user_id = u.user_id
            LEFT JOIN shop_item_images i ON m.item_id = i.item_id
            LEFT JOIN (
                SELECT item_id, COUNT(*) AS report_count
                FROM product_reports
                GROUP BY item_id
            ) r ON m.item_id = r.item_id
            GROUP BY m.item_id, u.user_id, r.report_count
            ORDER BY COALESCE(r.report_count, 0) DESC, m.created_at DESC;
        `);

        res.json(result.rows || []);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete a product and update admin stats
router.delete("/delete-product/:itemId", async (req, res) => {
    const { itemId } = req.params;
    const adminId = req.query.admin_id || 1;
    const client = await pool.connect();

    try {
        console.log(`Attempting to delete product with ID: ${itemId}...`);

        await client.query("BEGIN");


        const productInfo = await client.query(`
            SELECT 
                m.title, 
                m.description,
                m.price,
                a.email, 
                a.first_name,
                (SELECT image_url FROM shop_item_images WHERE item_id = m.item_id LIMIT 1) AS image_url
            FROM marketplace_items m
            JOIN accounts a ON m.user_id = a.user_id
            WHERE m.item_id = $1
        `, [itemId]);

        if (productInfo.rows.length === 0) {
            await client.query("ROLLBACK");
            console.warn(`Product with ID ${itemId} not found.`);
            return res.status(404).json({ error: "Product not found" });
        }

        const { title, description, price, email, first_name, image_url } = productInfo.rows[0];

        // Delete product from cart and favorites
        await client.query("DELETE FROM shopping_cart WHERE item_id = $1", [itemId]);
        await client.query("DELETE FROM favorites WHERE item_id = $1", [itemId]);

        // Delete product and related images
        await client.query("DELETE FROM shop_item_images WHERE item_id = $1", [itemId]);
        await client.query("DELETE FROM product_reports WHERE item_id = $1", [itemId]);
        await client.query("DELETE FROM marketplace_items WHERE item_id = $1", [itemId]);

        console.log(`Product "${title}" deleted from database.`);

        // Update admin stats
        await client.query(`
            UPDATE admins
            SET deleted_products = deleted_products + 1
            WHERE admin_id = $1
        `, [adminId]);

        console.log("Admin product count updated.");

        await client.query("COMMIT");


        try {
            const emailContent = `
                <p>Hi <strong>${first_name}</strong>,</p>
                <p>Your product has been removed by an administrator, due to reports by other users.</p>
            
                <p><strong>Product details:</strong></p>
                <ul>
                    <li><strong>Title:</strong> ${title}</li>
                    <li><strong>Description:</strong> ${description}</li>
                    <li><strong>Price:</strong> $${price}</li>
                </ul>
                
                ${image_url ? `<p><strong>Image:</strong><br/><img src="${image_url}" alt="Product image" style="max-width: 400px; border: 1px solid #ddd;"/></p>` : ""}
            
                <p>Best regards,<br/>Moderation Team</p>
            `;

            console.log("Email content prepared.");

            await transporter.sendMail({
                from: "oxanicorina0@gmail.com",
                to: email,
                subject: "Your product has been removed by the admin",
                html: emailContent
            });

            console.log("Email sent successfully.");
        } catch (mailErr) {
            console.warn("Failed to send email:", mailErr);
        }

        res.json({ message: "Product deleted and email sent" });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error deleting product:", err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
});

router.get("/reports/:itemId", async (req, res) => {
  const { itemId } = req.params;

  try {
    const result = await pool.query(`
      SELECT a.user_id, a.first_name, a.last_name, a.profile_picture
      FROM product_reports pr
      JOIN accounts a ON pr.user_id = a.user_id
      WHERE pr.item_id = $1
    `, [itemId]);

    res.json(result.rows || []);
  } catch (err) {
    console.error("Error fetching product reporters:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
