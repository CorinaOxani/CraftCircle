const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.get("/search", async (req, res) => {
    const { userId, query } = req.query;
    const searchTerm = `%${query.toLowerCase()}%`;
  
    if (!userId || !query) {
      return res.status(400).json({ error: "Missing parameters" });
    }
  
    try {
      const followedResult = await pool.query(
        `SELECT a.user_id, a.first_name, a.last_name, a.profile_picture
         FROM follows f
         JOIN accounts a ON a.user_id = f.following_id
         WHERE f.follower_id = $1
           AND (LOWER(a.first_name) LIKE $2 OR LOWER(a.last_name) LIKE $2)
         LIMIT 10`,
        [userId, searchTerm]
      );
  
      const followedIds = followedResult.rows.map((u) => u.user_id);
      const excludeList = followedIds.length > 0 ? `AND user_id NOT IN (${followedIds.map((_, i) => `$${i + 3}`).join(", ")})` : "";
  
      const values = [searchTerm, userId, ...followedIds];
  
      const allResult = await pool.query(
        `SELECT user_id, first_name, last_name, profile_picture
         FROM accounts
         WHERE (LOWER(first_name) LIKE $1 OR LOWER(last_name) LIKE $1)
           AND user_id != $2
           ${excludeList}
         LIMIT 10`,
        values
      );
  

      const selfMatch = await pool.query(
        `SELECT user_id, first_name, last_name, profile_picture
         FROM accounts
         WHERE user_id = $1 AND (LOWER(first_name) LIKE $2 OR LOWER(last_name) LIKE $2)`,
        [userId, searchTerm]
      );
  
      const allUsers = [...selfMatch.rows, ...followedResult.rows, ...allResult.rows];
      const uniqueUsers = new Map();
      allUsers.forEach(user => uniqueUsers.set(user.user_id, user));
  
      res.json(Array.from(uniqueUsers.values()));
    } catch (err) {
      console.error("Search error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });


router.post("/conversations", async (req, res) => {
    const { user1_id, user2_id } = req.body;
  
    if (!user1_id || !user2_id) {
      return res.status(400).json({ error: "Missing user IDs" });
    }
  
    try {

      const existing = await pool.query(
        `SELECT * FROM conversations 
         WHERE (user1_id = $1 AND user2_id = $2) 
            OR (user1_id = $2 AND user2_id = $1)`,
        [user1_id, user2_id]
      );
  
      if (existing.rows.length > 0) {
        return res.json(existing.rows[0]);
      }
  
      const result = await pool.query(
        `INSERT INTO conversations (user1_id, user2_id, created_at)
         VALUES ($1, $2, NOW())
         RETURNING *`,
        [user1_id, user2_id]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(" Error creating conversation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });


router.get("/:conversationId", async (req, res) => {
    const { conversationId } = req.params;
  
    try {
      const result = await pool.query(
        `SELECT m.message_id, m.conversation_id, m.sender_id, m.receiver_id,
                m.content, m.created_at, a.first_name, a.last_name, a.profile_picture
         FROM messages m
         JOIN accounts a ON m.sender_id = a.user_id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at ASC`,
        [conversationId]
      );
  
      res.json(result.rows || []);
    } catch (err) {
      console.error(" Error loading messages:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

router.post("/send", async (req, res) => {
    const { sender_id, receiver_id, content } = req.body;
  
    if (!sender_id || !receiver_id || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    try {

      const convoCheck = await pool.query(
        `SELECT conversation_id
         FROM conversations
         WHERE (user1_id = $1 AND user2_id = $2)
            OR (user1_id = $2 AND user2_id = $1)
         LIMIT 1`,
        [sender_id, receiver_id]
      );
  
      let conversation_id;
  
      if (convoCheck.rows.length > 0) {

        conversation_id = convoCheck.rows[0].conversation_id;
      } else {

        const convoInsert = await pool.query(
          `INSERT INTO conversations (user1_id, user2_id)
           VALUES ($1, $2)
           RETURNING conversation_id`,
          [sender_id, receiver_id]
        );
        conversation_id = convoInsert.rows[0].conversation_id;
      }
  
      const insertMessage = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, content, created_at, conversation_id)
         VALUES ($1, $2, $3, NOW(), $4)
         RETURNING *`,
        [sender_id, receiver_id, content, conversation_id]
      );
  
      res.status(201).json(insertMessage.rows[0]);
    } catch (err) {
      console.error(" Error sending message:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

router.get("/conversations/:userId", async (req, res) => {
    const { userId } = req.params;
  
    try {
      const result = await pool.query(
        `SELECT c.conversation_id,
                a.user_id,
                a.first_name,
                a.last_name,
                a.profile_picture,
                (
                  SELECT m.content
                  FROM messages m
                  WHERE m.conversation_id = c.conversation_id
                  ORDER BY m.created_at DESC
                  LIMIT 1
                ) AS last_message_preview
         FROM conversations c
         JOIN accounts a ON 
           (a.user_id = CASE 
              WHEN c.user1_id = $1 THEN c.user2_id 
              ELSE c.user1_id END)
         WHERE c.user1_id = $1 OR c.user2_id = $1
         ORDER BY c.created_at DESC`
      , [userId]);
  
      res.json(result.rows);
    } catch (err) {
      console.error("Error loading conversations:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  
module.exports = router;
