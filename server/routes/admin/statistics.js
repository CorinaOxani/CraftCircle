const express = require("express");
const router = express.Router();
const pool = require("../../config/database");

const generateMonthsQuery = (tableName, dateColumn) => `
    WITH months AS (
        SELECT 
            TO_CHAR(date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' * s.a, 'YYYY-MM') AS month
        FROM generate_series(0, 11) AS s(a)
    )
    SELECT 
        m.month,
        COALESCE(SUM(CASE WHEN TO_CHAR(${dateColumn}, 'YYYY-MM') <= m.month THEN 1 ELSE 0 END), 0) AS count
    FROM months m
    LEFT JOIN ${tableName} t ON TO_CHAR(t.${dateColumn}, 'YYYY-MM') <= m.month
    GROUP BY m.month
    ORDER BY m.month;
`;

// Total Users și New This Month
router.get("/users", async (req, res) => {
  try {
      const totalUsers = await pool.query(`SELECT COUNT(*) AS total FROM accounts`);
      
      const newThisMonth = await pool.query(`
          SELECT COUNT(*) AS newThisMonth 
          FROM accounts 
          WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      `);
      
      res.json({
          total: totalUsers.rows[0].total,
          newThisMonth: newThisMonth.rows[0].newthismonth
      });
  } catch (err) {
      console.error("Error fetching users stats:", err);
      res.status(500).json({ error: "Failed to fetch users statistics" });
  }
});


// Total Posts, Reported Posts, Total Likes
router.get("/posts", async (req, res) => {
    try {
        const totalPosts = await pool.query(`SELECT COUNT(*) AS total FROM posts`);
        
        const reportedPosts = await pool.query(`SELECT COUNT(*) AS reported FROM post_reports`);

        
        res.json({
            total: totalPosts.rows[0].total,
            reported: reportedPosts.rows[0].reported
        });
    } catch (err) {
        console.error("Error fetching posts stats:", err);
        res.status(500).json({ error: "Failed to fetch posts statistics" });
    }
});

// Total Products, Reported Products
router.get("/products", async (req, res) => {
    try {
        const totalProducts = await pool.query(`SELECT COUNT(*) AS total FROM marketplace_items`);
        
        const reportedProducts = await pool.query(`SELECT COUNT(*) AS reported FROM product_reports`);
        
        res.json({
            total: totalProducts.rows[0].total,
            reported: reportedProducts.rows[0].reported
        });
    } catch (err) {
        console.error("Error fetching products stats:", err);
        res.status(500).json({ error: "Failed to fetch products statistics" });
    }
});

// Total Messages, Read, Unread
router.get("/messages", async (req, res) => {
    try {
        const totalMessages = await pool.query(`SELECT COUNT(*) AS total FROM messages`);
        
        const readMessages = await pool.query(`SELECT COUNT(*) AS read FROM messages WHERE is_read = true`);
        
        const unreadMessages = await pool.query(`SELECT COUNT(*) AS unread FROM messages WHERE is_read = false`);
        
        res.json({
            total: totalMessages.rows[0].total,
            read: readMessages.rows[0].read,
            unread: unreadMessages.rows[0].unread
        });
    } catch (err) {
        console.error("Error fetching messages stats:", err);
        res.status(500).json({ error: "Failed to fetch messages statistics" });
    }
});

// Total Orders, Completed, Pending
router.get("/orders", async (req, res) => {
    try {
        const totalOrders = await pool.query(`SELECT COUNT(*) AS total FROM orders`);
        
        const completedOrders = await pool.query(`
            SELECT COUNT(*) AS completed 
            FROM orders 
            WHERE status = 'completed'
        `);
        
        const pendingOrders = await pool.query(`
            SELECT COUNT(*) AS pending 
            FROM orders 
            WHERE status = 'pending'
        `);
        
        res.json({
            total: totalOrders.rows[0].total,
            completed: completedOrders.rows[0].completed,
            pending: pendingOrders.rows[0].pending
        });
    } catch (err) {
        console.error("Error fetching orders stats:", err);
        res.status(500).json({ error: "Failed to fetch orders statistics" });
    }
});

// Total Likes, Total Follows (App level stats)
router.get("/app", async (req, res) => {
    try {
        const totalLikes = await pool.query(`SELECT COUNT(*) AS totalLikes FROM likes`);
        
        const totalFollows = await pool.query(`SELECT COUNT(*) AS totalFollows FROM follows`);
        
        res.json({
          totalLikes: totalLikes.rows[0].totallikes,
          totalFollows: totalFollows.rows[0].totalfollows
      });
      
    } catch (err) {
        console.error("Error fetching app stats:", err);
        res.status(500).json({ error: "Failed to fetch app statistics" });
    }
});
// Monthly Cumulative User Growth
router.get("/users/progress", async (req, res) => {
    try {
        const result = await pool.query(generateMonthsQuery("accounts", "created_at"));
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching users growth stats:", err);
        res.status(500).json({ error: "Failed to fetch users growth statistics" });
    }
});

// Monthly Cumulative Post Growth
router.get("/posts/progress", async (req, res) => {
    try {
        const result = await pool.query(generateMonthsQuery("posts", "created_at"));
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching posts growth stats:", err);
        res.status(500).json({ error: "Failed to fetch posts growth statistics" });
    }
});

// Monthly Cumulative Product Growth
router.get("/products/progress", async (req, res) => {
    try {
        const result = await pool.query(generateMonthsQuery("marketplace_items", "created_at"));
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching products growth stats:", err);
        res.status(500).json({ error: "Failed to fetch products growth statistics" });
    }
});

// Monthly Cumulative Message Growth
router.get("/messages/progress", async (req, res) => {
    try {
        const result = await pool.query(generateMonthsQuery("messages", "created_at"));
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching messages growth stats:", err);
        res.status(500).json({ error: "Failed to fetch messages growth statistics" });
    }
});

// Monthly Cumulative Order Growth
router.get("/orders/progress", async (req, res) => {
    try {
        const result = await pool.query(generateMonthsQuery("orders", "created_at"));
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching orders growth stats:", err);
        res.status(500).json({ error: "Failed to fetch orders growth statistics" });
    }
});

// Monthly Cumulative Likes and Follows Growth
router.get("/app/progress", async (req, res) => {
    try {
        const likesGrowth = await pool.query(generateMonthsQuery("likes", "created_at"));
        const followsGrowth = await pool.query(generateMonthsQuery("follows", "created_at"));
        
        res.json({
            likes: likesGrowth.rows,
            follows: followsGrowth.rows
        });
    } catch (err) {
        console.error("Error fetching app growth stats:", err);
        res.status(500).json({ error: "Failed to fetch app growth statistics" });
    }
});
// Lista tuturor utilizatorilor
router.get("/users/all", async (req, res) => {
    try {
        const allUsers = await pool.query(`SELECT user_id, first_name, last_name, email FROM accounts ORDER BY created_at DESC`);
        res.json(allUsers.rows);
    } catch (err) {
        console.error("Error fetching all users:", err);
        res.status(500).json({ error: "Failed to fetch all users" });
    }
});

// Lista utilizatorilor noi din această lună
router.get("/users/new", async (req, res) => {
    try {
        const newUsers = await pool.query(`
            SELECT user_id, first_name, last_name, email 
            FROM accounts 
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
            ORDER BY created_at DESC
        `);
        res.json(newUsers.rows);
    } catch (err) {
        console.error("Error fetching new users:", err);
        res.status(500).json({ error: "Failed to fetch new users" });
    }
});

module.exports = router;
