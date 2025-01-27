const express = require("express");
const router = express.Router();
const pool = require("../config/database"); // Importă conexiunea la baza de date

// Endpoint pentru autentificare tradițională
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verifică dacă utilizatorul există
    const user = await pool.query("SELECT * FROM accounts WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    // Verifică parola (fără criptare)
    if (password !== user.rows[0].password) {
      return res.status(401).json({ error: "Invalid password." });
    }

    // Autentificare reușită
    req.login(user.rows[0], (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed." });
      }
      res.json({
        message: "Login successful.",
        user: {
          id: user.rows[0].user_id,
          email: user.rows[0].email,
          firstName: user.rows[0].first_name,
          lastName: user.rows[0].last_name,
        },
      });
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "An error occurred." });
  }
});


// Endpoint pentru adăugarea unui utilizator
router.post("/adduser", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      birth_date,
      profile_picture,
      bio,
    } = req.body;

    // Verifică dacă utilizatorul există deja
    const existingUser = await pool.query(
      `SELECT * FROM accounts WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "User with this email already exists.",
      });
    }

    // Inserare utilizator în baza de date
    const result = await pool.query(
      `
      INSERT INTO accounts (first_name, last_name, email, password, birth_date, profile_picture, bio)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
      `,
      [
        first_name,
        last_name,
        email,
        password,
        birth_date || null,
        profile_picture || null,
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

module.exports = router;
