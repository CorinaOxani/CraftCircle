const express = require("express");
const pool = require("../../config/database");
const router = express.Router();


// GET all products for moderation
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

// GET reporters for a specific product
router.get("/reports/:itemId", async (req, res) => {
    const { itemId } = req.params;
    try {
        const result = await pool.query(`
            SELECT u.user_id, u.first_name, u.last_name, u.profile_picture
            FROM product_reports pr
            JOIN accounts u ON pr.user_id = u.user_id
            WHERE pr.item_id = $1
        `, [itemId]);

        res.json(result.rows || []);
    } catch (err) {
        console.error("Error fetching report users:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE a user and all their products
router.delete("/delete-user/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        await pool.query("DELETE FROM shop_item_images WHERE item_id IN (SELECT item_id FROM marketplace_items WHERE user_id = $1)", [userId]);
        await pool.query("DELETE FROM product_reports WHERE item_id IN (SELECT item_id FROM marketplace_items WHERE user_id = $1)", [userId]);
        await pool.query("DELETE FROM marketplace_items WHERE user_id = $1", [userId]);
        await pool.query("DELETE FROM accounts WHERE user_id = $1", [userId]);

        res.json({ message: "User and their products deleted successfully." });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
