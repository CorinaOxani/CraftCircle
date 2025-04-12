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
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id in query" });
    }
  
    try {
      const result = await pool.query(
        `SELECT m.message_id, m.conversation_id, m.sender_id, m.receiver_id,
        m.content, m.created_at, m.is_read,
        a.first_name, a.last_name, a.profile_picture
        FROM messages m
        JOIN accounts a ON m.sender_id = a.user_id
        WHERE m.conversation_id = $1
          AND NOT (
            ($2::int = m.sender_id AND m.deleted_for_sender = TRUE)
            OR
            ($2::int = m.receiver_id AND m.deleted_for_receiver = TRUE)
          )
        ORDER BY m.created_at ASC
        `,
        [conversationId, user_id]
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
        `INSERT INTO messages (sender_id, receiver_id, content, created_at, conversation_id, is_read)
         VALUES ($1, $2, $3, NOW(), $4, $5)
         RETURNING *`,
        [
          sender_id,
          receiver_id,
          content,
          conversation_id,
          sender_id === receiver_id ? true : false,  
        ]
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
                    AND NOT (
                      ($1::int = m.sender_id AND m.deleted_for_sender = TRUE) OR
                      ($1::int = m.receiver_id AND m.deleted_for_receiver = TRUE)
                    )
                  ORDER BY m.created_at DESC
                  LIMIT 1
                ) AS last_message_preview
         FROM conversations c
         JOIN accounts a ON 
           (a.user_id = CASE 
              WHEN c.user1_id = $1 THEN c.user2_id 
              ELSE c.user1_id END)
         WHERE 
           (c.user1_id = $1 AND c.deleted_for_user1 = FALSE)
           OR 
           (c.user2_id = $1 AND c.deleted_for_user2 = FALSE)
         ORDER BY c.created_at DESC`,
        [userId]
      );
      
  
      res.json(result.rows);
    } catch (err) {
      console.error("Error loading conversations:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/mark-read", async (req, res) => {
    const { user_id, conversation_id } = req.body;
  
    if (!user_id || !conversation_id) {
      return res.status(400).json({ error: "Missing parameters" });
    }
  
    try {
      await pool.query(
        `UPDATE messages
         SET is_read = TRUE
         WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
        [conversation_id, user_id]
      );
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error marking messages as read:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  router.get("/unread/:userId", async (req, res) => {
    const { userId } = req.params;
  
    try {
      const result = await pool.query(
        `SELECT conversation_id, COUNT(*) as unread_count
         FROM messages
         WHERE receiver_id = $1 AND is_read = FALSE
         GROUP BY conversation_id`,
        [userId]
      );
  
      const unreadByConversation = {};
      let total = 0;
  
      result.rows.forEach((row) => {
        unreadByConversation[row.conversation_id] = parseInt(row.unread_count, 10);
        total += parseInt(row.unread_count, 10);
      });
  
      res.json({
        total,
        byConversation: unreadByConversation
      });
    } catch (err) {
      console.error("Error fetching unread messages:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  router.post("/delete", async (req, res) => {
    const { message_id, user_id } = req.body;
  
    if (!message_id || !user_id) {
      return res.status(400).json({ error: "Missing parameters" });
    }
  
    try {
      const msgResult = await pool.query(
        `SELECT sender_id, receiver_id, deleted_for_sender, deleted_for_receiver
         FROM messages WHERE message_id = $1`,
        [message_id]
      );
  
      if (msgResult.rows.length === 0) {
        return res.status(404).json({ error: "Message not found" });
      }
  
      const message = msgResult.rows[0];
      const isSender = parseInt(user_id) === message.sender_id;
      const isReceiver = parseInt(user_id) === message.receiver_id;
  
      if (!isSender && !isReceiver) {
        return res.status(403).json({ error: "Not allowed to delete this message" });
      }
  

      if (isSender) {
        await pool.query(
          `UPDATE messages SET deleted_for_sender = TRUE WHERE message_id = $1`,
          [message_id]
        );
      } else if (isReceiver) {
        await pool.query(
          `UPDATE messages SET deleted_for_receiver = TRUE WHERE message_id = $1`,
          [message_id]
        );
      }
  
      const shouldDelete =
        (isSender && message.deleted_for_receiver) ||
        (isReceiver && message.deleted_for_sender);
  
      if (shouldDelete) {
        await pool.query(
          `DELETE FROM messages WHERE message_id = $1`,
          [message_id]
        );
      }
  
      res.json({ success: true, deletedCompletely: shouldDelete });
    } catch (err) {
      console.error("Error deleting message:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/delete-for-all", async (req, res) => {
    const { message_id, user_id } = req.body;
  
    if (!message_id || !user_id) {
      return res.status(400).json({ error: "Missing parameters" });
    }
  
    try {
      const result = await pool.query(
        `SELECT sender_id FROM messages WHERE message_id = $1`,
        [message_id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Message not found" });
      }
  
      const senderId = result.rows[0].sender_id;
      if (parseInt(user_id) !== senderId) {
        return res.status(403).json({ error: "Only the sender can delete for all" });
      }
  
      await pool.query(
        `DELETE FROM messages WHERE message_id = $1`,
        [message_id]
      );
  
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting message for all:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/conversations/delete", async (req, res) => {
    const { conversation_id, user_id } = req.body;
  
    if (!conversation_id || !user_id) {
      return res.status(400).json({ error: "Missing parameters" });
    }
  
    try {
      const result = await pool.query(
        `SELECT user1_id, user2_id FROM conversations WHERE conversation_id = $1`,
        [conversation_id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Conversation not found" });
      }
  
      const { user1_id, user2_id } = result.rows[0];
  
      if (parseInt(user_id) === user1_id) {
        await pool.query(
          `UPDATE conversations SET deleted_for_user1 = TRUE WHERE conversation_id = $1`,
          [conversation_id]
        );
      } else if (parseInt(user_id) === user2_id) {
        await pool.query(
          `UPDATE conversations SET deleted_for_user2 = TRUE WHERE conversation_id = $1`,
          [conversation_id]
        );
      } else {
        return res.status(403).json({ error: "User not part of this conversation" });
      }
  
      res.json({ success: true });
    } catch (err) {
      console.error("Error soft-deleting conversation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  
  
module.exports = router;
