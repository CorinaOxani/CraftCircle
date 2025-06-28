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
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login" }),
  (req, res) => {
    if (!req.user) {
      console.log(" No user returned from Google.");
      return res.redirect("http://localhost:3000/login");
    }

    console.log("User:", req.user);
    console.log("isNewUser:", req.user.isNewUser);

    const redirectUrl = `http://localhost:3000/login?user_id=${req.user.user_id}&isNewUser=${req.user.isNewUser}`;
    res.redirect(redirectUrl);
  }
);

// Ruta pentru Facebook OAuth
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "http://localhost:3000/login" }),
  (req, res) => {
    if (!req.user) {
      console.log("No user returned from Facebook.");
      return res.redirect("http://localhost:3000/login");
    }

    console.log(" Facebook login callback reached.");
    console.log(" User:", req.user);
    console.log(" isNewUser:", req.user.isNewUser);

    const redirectUrl = `http://localhost:3000/login?user_id=${req.user.user_id}&isNewUser=${req.user.isNewUser}`;
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
    // Redirectioneaza catre pagina de login din frontend
    res.redirect("http://localhost:3000/login");
  });
});

module.exports = router;
