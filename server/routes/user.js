const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const bcrypt = require("bcrypt");
const transporter = require("../config/emailTransporter");
const saltRounds = 10;
const multer = require("multer");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM accounts WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password." });
    }

    res.json({
      message: "Login successful.",
      user: {
        user_id: user.rows[0].user_id,
        email: user.rows[0].email,
        first_name: user.rows[0].first_name,
        last_name: user.rows[0].last_name,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "An error occurred." });
  }
});

// REGISTER
router.post("/adduser", async (req, res) => {
  try {
    const { first_name, last_name, email, password, birth_date, bio } = req.body;

    const existingUser = await pool.query(
      "SELECT * FROM accounts WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO accounts (first_name, last_name, email, password, birth_date, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;`,
      [
        first_name,
        last_name,
        email,
        hashedPassword,
        birth_date || null,
        bio || null,
      ]
    );

    res.status(201).json({
      message: "User added successfully!",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error adding user:", err.message);
    res.status(500).json({ error: "An error occurred while adding the user." });
  }
});

// SALVARE DATE PROFIL
router.post("/additional-info", async (req, res) => {
  try {
    const { user_id, birth_date, country, city } = req.body;

    if (!user_id || !birth_date || !country || !city) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await pool.query(
      "SELECT * FROM accounts WHERE user_id = $1",
      [user_id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    await pool.query(
      `UPDATE accounts 
      SET birth_date = $1, country = $2, city = $3 
      WHERE user_id = $4`,
      [birth_date, country, city, user_id]
    );

    res.json({ message: "Additional info saved successfully!" });
  } catch (err) {
    console.error("Error saving additional info:", err.message);
    res.status(500).json({ error: "An error occurred while saving the data." });
  }
});


router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const result = await pool.query(
      `SELECT 
          a.user_id, 
          a.first_name, 
          a.last_name, 
          a.email, 
          COALESCE(a.profile_picture, '') AS profile_picture, 
          COALESCE(a.bio, 'No bio available') AS bio, 
          COALESCE(a.country, 'Unknown') AS country, 
          COALESCE(a.city, 'Unknown') AS city,
          -- Număr de urmăritori
          (SELECT COUNT(*) FROM follows WHERE following_id = a.user_id) AS followers_count,
          -- Număr de utilizatori urmăriți
          (SELECT COUNT(*) FROM follows WHERE follower_id = a.user_id) AS following_count,
          -- Număr total de postări
          (SELECT COUNT(*) FROM posts WHERE user_id = a.user_id) AS posts_count
      FROM accounts a 
      WHERE a.user_id = $1;`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// SCHIMBARE PAROLĂ USER + email notificare
router.post("/change-password", async (req, res) => {
  const { user_id, oldPassword, newPassword } = req.body;

  try {
    const result = await pool.query("SELECT email, password, first_name FROM accounts WHERE user_id = $1", [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const { password: hashedPassword, email, first_name } = result.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Old password is incorrect." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await pool.query("UPDATE accounts SET password = $1 WHERE user_id = $2", [hashedNewPassword, user_id]);

    // Trimitere email
    const mailOptions = {
      from: "oxanicorina0@gmail.com",
      to: email,
      subject: "Your CraftCircle password was changed",
      html: `<p>Hi ${first_name},</p>
             <p>This is a confirmation that your CraftCircle password has been changed successfully.</p>
             <p>If you didn’t perform this action, please contact our support team immediately.</p>
             <br/>
             <p>CraftCircle Team</p>`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Password updated successfully and email sent." });
  } catch (err) {
    console.error("Error changing password:", err.message);
    res.status(500).json({ error: "An error occurred while changing password." });
  }
});

router.post("/update-profile", async (req, res) => {
  const { user_id, country, city, bio } = req.body;

  if (!user_id || !country || !city) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const result = await pool.query(
      `UPDATE accounts SET country = $1, city = $2, bio = $3 WHERE user_id = $4`,
      [country.trim(), city.trim(), bio?.trim() || "", user_id]
    );

    return res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/send-reset-code", async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query(
      "SELECT first_name FROM accounts WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Email not found" });
    }

    const firstName = result.rows[0].first_name;
    const code = Math.floor(100000 + Math.random() * 900000); // 6 cifre

    await pool.query(`
      INSERT INTO password_reset_codes (email, code, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '15 minutes')
      ON CONFLICT (email) DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '15 minutes'
    `, [email, code]);

    // Trimite emailul
    await transporter.sendMail({
      from: "oxanicorina0@gmail.com",
      to: email,
      subject: "CraftCircle - Your Password Reset Code",
      html: `<p>Hi ${firstName},</p>
             <p>Your password reset code is: <strong>${code}</strong>.</p>
             <p>This code is valid for 15 minutes.</p>`
    });

    res.json({ message: "Reset code sent successfully." });
  } catch (err) {
    console.error("Error sending reset code:", err);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/verify-reset-code", async (req, res) => {
  const { email, code } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM password_reset_codes WHERE email = $1 AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1",
      [email]
    );

    if (result.rows.length === 0 || result.rows[0].code !== code) {
      return res.status(400).json({ error: "Invalid or expired code." });
    }

    res.json({ message: "Code verified." });
  } catch (err) {
    console.error("Error verifying code:", err);
    res.status(500).json({ error: "Server error." });
  }
});


router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: "Missing email or password." });
  }

  try {
    const userRes = await pool.query("SELECT user_id, first_name FROM accounts WHERE email = $1", [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Email not found. Please Sign up." });
    }

    const userId = userRes.rows[0].user_id;
    const firstName = userRes.rows[0].first_name;


    const hashed = await bcrypt.hash(newPassword, saltRounds);


    await pool.query("UPDATE accounts SET password = $1 WHERE user_id = $2", [hashed, userId]);


    await transporter.sendMail({
      from: "oxanicorina0@gmail.com",
      to: email,
      subject: "Your CraftCircle password has been changed",
      html: `<p>Hi ${firstName},</p>
             <p>Your CraftCircle password has been updated successfully.</p>
             <p>If you didn’t do this, contact support immediately.</p>
             <br/><p>CraftCircle Team</p>`
    });

    res.json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Error resetting password:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.delete("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    await pool.query("DELETE FROM accounts WHERE user_id = $1", [userId]);
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Error deleting user:", err.message);
    res.status(500).json({ error: "Could not delete user. Check related foreign key constraints." });
  }
});

router.post("/report", async (req, res) => {
  const { reporter_id, reported_id, reason } = req.body;

  if (!reporter_id || !reported_id || !reason) {
    return res.status(400).json({ message: "Incomplete report data." });
  }

  try {

    const existing = await pool.query(
      `SELECT 1 FROM user_reports
       WHERE reporter_id = $1
         AND reported_id = $2
         AND created_at::date = CURRENT_DATE`,
      [reporter_id, reported_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "You have already reported this user today." });
    }

    await pool.query(
      `INSERT INTO user_reports (reporter_id, reported_id, reason)
       VALUES ($1, $2, $3)`,
      [reporter_id, reported_id, reason]
    );

    res.status(200).json({ message: "Report submitted successfully." });
  } catch (err) {
    console.error("Error submitting report:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});



module.exports = router;
