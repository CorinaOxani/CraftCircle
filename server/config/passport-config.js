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

        let isNewUser = false;
        let user;

        if (existingUser.rows.length > 0) {
          // Utilizator existent
          user = existingUser.rows[0];
        } else {
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

          user = newUser.rows[0];
          isNewUser = true;
        }

        // Adaugă `isNewUser` la obiectul utilizatorului pentru a-l folosi în redirect
        user.isNewUser = isNewUser;

        return done(null, user);
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
        let isNewUser = false;
        let user;

        // Verifică dacă utilizatorul există deja în baza de date
        const existingUser = await pool.query(
          `SELECT * FROM accounts WHERE email = $1`,
          [email]
        );

        if (existingUser.rows.length > 0) {
          // Utilizatorul există deja
          user = existingUser.rows[0];
        } else {
          // Creează un utilizator nou
          const newUser = await pool.query(
            `INSERT INTO accounts (first_name, last_name, email, profile_picture, password, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING *`,
            [
              profile.name?.givenName || "Facebook User",
              profile.name?.familyName || "Unknown",
              email,
              profile.photos?.[0]?.value || null,
              temporaryPassword,
            ]
          );

          user = newUser.rows[0];
          isNewUser = true;
        }

        // Adaugă `isNewUser` la obiectul utilizatorului pentru a-l folosi în redirect
        user.isNewUser = isNewUser;

        return done(null, user);
      } catch (err) {
        console.error("Error authenticating with Facebook:", err);
        return done(err, null);
      }
    }
  )
);


// Serializare utilizator
passport.serializeUser((user, done) => {
  done(null, { user_id: user.user_id, isNewUser: user.isNewUser }); // păstrăm ambele
});

// Deserializare utilizator
passport.deserializeUser(async (data, done) => {
  try {
    const result = await pool.query("SELECT * FROM accounts WHERE user_id = $1", [data.user_id]);

    if (result.rows.length === 0) {
      return done(null, false);
    }

    const user = result.rows[0];
    user.isNewUser = data.isNewUser; // restaurăm flag-ul

    done(null, user);
  } catch (err) {
    console.error("Error deserializing user:", err);
    done(err, null);
  }
});

module.exports = passport;
