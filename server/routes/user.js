const express = require("express");
const router = express.Router();
const pool = require("../config/database"); // Importă conexiunea la baza de date
const bcrypt = require("bcrypt");
const saltRounds = 10;

// LOGIN: Verifică datele utilizatorului
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
        id: user.rows[0].user_id,
        email: user.rows[0].email,
        firstName: user.rows[0].first_name,
        lastName: user.rows[0].last_name,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "An error occurred." });
  }
});

// REGISTER: Adaugă un utilizator nou
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

// SALVARE DATE PROFIL (birth_date, country, city)
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

module.exports = router;
