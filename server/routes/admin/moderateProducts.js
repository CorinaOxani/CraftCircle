const express = require("express");
const pool = require("../../config/database");
const router = express.Router();
const nodemailer = require("nodemailer");

// === CONFIGURARE EMAIL ===
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "oxanicorina0@gmail.com",
        pass: "zssj zxlz jaok bcpw",
    },
    logger: true,
    debug: true,
});

// === Verifică dacă serverul de email este pregătit ===
transporter.verify((error, success) => {
    if (error) {
        console.error("Email server verification error:", error);
    } else {
        console.log(" Email server is ready to take messages");
    }
});

// === GET all products for moderation ===
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

// === DELETE a Product and Send Email ===
router.delete("/delete-product/:itemId", async (req, res) => {
    const { itemId } = req.params;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // === Obține informațiile despre produs ===
        const productInfo = await client.query(`
            SELECT 
                m.title, 
                m.price,
                a.email, 
                a.first_name
            FROM marketplace_items m
            JOIN accounts a ON m.user_id = a.user_id
            WHERE m.item_id = $1
        `, [itemId]);

        // === Verifică dacă produsul există ===
        if (productInfo.rows.length === 0) {
            await client.query("ROLLBACK");
            console.warn(` Product with ID ${itemId} not found.`);
            return res.status(404).json({ error: "Product not found" });
        }

        const { title, price, email, first_name } = productInfo.rows[0];

        // === Trimite email de notificare ===
        try {
            console.log(" Ready to send email to:", email);
            const emailContent = `
                <p>Hi <strong>${first_name}</strong>,</p>
                <p>Your product has been removed by an administrator.</p>
            
                <p><strong>Product details:</strong></p>
                <ul>
                    <li><strong>Title:</strong> ${title}</li>
                    <li><strong>Price:</strong> $${price}</li>
                </ul>
            
                <p>Best regards,<br/>Moderation Team</p>
            `;

            console.log(" Email content prepared:", emailContent);

            const emailResponse = await transporter.sendMail({
                from: "oxanicorina0@gmail.com",
                to: email,
                subject: "Your product has been removed by the admin",
                html: emailContent
            });

            console.log(" Email sent successfully:", emailResponse);
        } catch (mailErr) {
            console.warn(" Product deleted but failed to send email:", mailErr);
        }

        // === Șterge produsul din baza de date ===
        await client.query("DELETE FROM shop_item_images WHERE item_id = $1", [itemId]);
        await client.query("DELETE FROM product_reports WHERE item_id = $1", [itemId]);
        await client.query("DELETE FROM marketplace_items WHERE item_id = $1", [itemId]);

        await client.query("COMMIT");
        console.log(` Product "${title}" deleted successfully.`);

        res.json({ message: "Product deleted and email sent" });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error deleting product:", err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
});

module.exports = router;
