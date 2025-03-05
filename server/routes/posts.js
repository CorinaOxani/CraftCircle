const express = require("express");
const router = express.Router();
const pool = require("../db"); // Conexiunea la PostgreSQL

// Obține postările unui utilizator
router.get("/", async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const result = await pool.query(
            "SELECT post_id, content, image_url, created_at FROM posts WHERE user_id = $1 ORDER BY created_at DESC",
            [user_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
