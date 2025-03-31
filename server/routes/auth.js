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
    if (!req.user) {
      return res.redirect("http://localhost:3000/login");
    }

    // URL-ul de redirecționare cu `user_id` și `isNewUser`
    const redirectUrl = `http://localhost:3000/auth-success?user_id=${req.user.user_id}&isNewUser=${req.user.isNewUser}`;

    res.redirect(redirectUrl);
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
