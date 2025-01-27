const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const pool = require("./database");

// Configurare Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: "731035106499-kokfbqbt7ef03rc34sbv5vahkaoe5cko.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:4000/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // Verifică dacă utilizatorul există deja în baza de date
        const existingUser = await pool.query(
          `SELECT * FROM accounts WHERE email = $1`,
          [email]
        );

        if (existingUser.rows.length > 0) {
          // Utilizatorul există deja - autentifică-l
          return done(null, existingUser.rows[0]);
        }

        // Creează un utilizator nou
        const newUser = await pool.query(
          `INSERT INTO accounts (first_name, last_name, email, profile_picture, password, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [
            profile.name.givenName,
            profile.name.familyName,
            email,
            profile.photos[0]?.value || null,
            "google", // Parolă temporară
          ]
        );

        return done(null, newUser.rows[0]);
      } catch (err) {
        console.error("Error authenticating with Google:", err);
        return done(err, null);
      }
    }
  )
);

// Configurare Facebook OAuth
passport.use(
  new FacebookStrategy(
    {
      clientID: "587989000683295",
      clientSecret: "7360a0fdd26518cdfe5e382632e9fdde",
      callbackURL: "http://localhost:4000/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "picture.type(large)"], // Preia email-ul și numele utilizatorului
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || `facebook_${profile.id}@noemail.com`;
        const temporaryPassword = `facebook_${profile.id}`;

        // Verifică dacă utilizatorul există deja în baza de date
        const existingUser = await pool.query(
          `SELECT * FROM accounts WHERE email = $1`,
          [email]
        );

        if (existingUser.rows.length > 0) {
          // Utilizatorul există deja - autentifică-l
          return done(null, existingUser.rows[0]);
        }

        // Creează un utilizator nou
        const newUser = await pool.query(
          `INSERT INTO accounts (first_name, last_name, email, profile_picture, password, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [
            profile.name.givenName || "Facebook User",
            profile.name.familyName || "Unknown",
            email,
            profile.photos?.[0]?.value || null,
            temporaryPassword,
          ]
        );

        return done(null, newUser.rows[0]);
      } catch (err) {
        console.error("Error authenticating with Facebook:", err);
        return done(err, null);
      }
    }
  )
);

// Serializare utilizator
passport.serializeUser((user, done) => {
  done(null, user.user_id); // Stocăm user_id în sesiune
});

// Deserializare utilizator
passport.deserializeUser(async (id, done) => {
  try {
    const user = await pool.query(`SELECT * FROM accounts WHERE user_id = $1`, [id]);

    if (user.rows.length === 0) {
      // Utilizatorul nu există
      return done(null, false);
    }

    done(null, user.rows[0]); // Returnează utilizatorul găsit
  } catch (err) {
    console.error("Error deserializing user:", err);
    done(err, null);
  }
});

module.exports = passport;
