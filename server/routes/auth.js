const express = require("express");
const passport = require("passport");
const router = express.Router();

// Ruta pentru Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "consent",
  })
);

// Callback-ul pentru Google OAuth
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login" }),
  (req, res) => {
    // Redirecționează utilizatorul către pagina de start a frontend-ului
    res.redirect("http://localhost:3000/");
  }
);

// Ruta pentru Facebook OAuth
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] }) // Preia numele și email-ul utilizatorului
);

// Callback-ul pentru Facebook OAuth
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "http://localhost:3000/login" }),
  (req, res) => {
    // Redirecționează utilizatorul către pagina de start a frontend-ului
    res.redirect("http://localhost:3000/");
  }
);

// Ruta pentru logout
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ error: "Logout failed." });
    }
    // Redirecționează către pagina de login din frontend
    res.redirect("http://localhost:3000/login");
  });
});

module.exports = router;
