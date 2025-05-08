const express = require("express");
const router = express.Router();
const pool = require("../../config/database");

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
        
        const totalLikes = await pool.query(`SELECT COUNT(*) AS likes FROM likes`);
        
        res.json({
            total: totalPosts.rows[0].total,
            reported: reportedPosts.rows[0].reported,
            likes: totalLikes.rows[0].likes
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

module.exports = router;
