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


router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.json({ message: "Google login successful!", user: req.user });
  }
);

/// Ruta pentru înregistrare/autentificare cu Facebook
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] }) // Preia numele și email-ul utilizatorului
);

// Callback-ul pentru Facebook (gestionarea redirecționării după autentificare)
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  (req, res) => {
    // Dacă utilizatorul este înregistrat cu succes, poți redirecționa către o pagină
    res.json({ message: "Facebook registration successful!", user: req.user });
  }
);

module.exports = router;
