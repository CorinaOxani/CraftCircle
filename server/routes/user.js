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


module.exports = router;
