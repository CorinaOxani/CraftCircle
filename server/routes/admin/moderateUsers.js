const express = require("express");
const router = express.Router();
const pool = require("../../config/database");
const transporter = require("../../config/emailTransporter");

// Get all users with report count, sorted by report count desc
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.user_id, a.first_name, a.last_name, a.email, a.bio, a.profile_picture, 
              COUNT(r.report_id) AS report_count
       FROM accounts a
       LEFT JOIN user_reports r ON a.user_id = r.reported_id
       GROUP BY a.user_id
       ORDER BY COUNT(r.report_id) DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all reports for a specific user
router.get("/reports/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
            r.reporter_id,
            r.reason, 
            acc.first_name || ' ' || acc.last_name AS reporter_name
        FROM user_reports r
        JOIN accounts acc ON r.reporter_id = acc.user_id
        WHERE r.reported_id = $1
        ORDER BY r.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a user + notify + increment deleted_users
router.delete("/delete-user/:userId", async (req, res) => {
    const { userId } = req.params;
  
    // TODO: setează asta corect în funcție de cum reții ID-ul adminului
    const adminId = req.session?.admin_id || 1;
  
    try {
      // 1. Obține emailul și numele userului înainte de ștergere
      const userResult = await pool.query(
        "SELECT email, first_name, last_name FROM accounts WHERE user_id = $1",
        [userId]
      );
  
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found." });
      }
  
      const { email, first_name, last_name } = userResult.rows[0];
  
      // 2. Șterge userul
      await pool.query("DELETE FROM accounts WHERE user_id = $1", [userId]);
  
      // 3. Trimite email de notificare
      const mailOptions = {
        from: "noreply@craftcircle.com", // sau adresa din config
        to: email,
        subject: "Your account has been removed",
        html: `
          <p>Dear ${first_name} ${last_name},</p>
          <p>Your account on CraftCircle has been deleted by an administrator due to repeated violations or reports.</p>
          <p>If you believe this was a mistake, you may contact us at support@craftcircle.com.</p>
          <br>
          <p>Best regards,<br>CraftCircle Team</p>
        `,
      };
  
      await transporter.sendMail(mailOptions);
  
      // 4. Incrementează `deleted_users` pentru admin
      await pool.query(
        `UPDATE admins SET deleted_users = COALESCE(deleted_users, 0) + 1 WHERE admin_id = $1`,
        [adminId]
      );
  
      res.status(200).json({ message: "User deleted and notified successfully." });
  
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Internal server error. Check logs." });
    }
  });
module.exports = router;