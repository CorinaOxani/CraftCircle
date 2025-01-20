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
        // Obține email-ul utilizatorului
        const email = profile.emails[0].value;

        // Verifică dacă utilizatorul există deja în baza de date
        const existingUser = await pool.query(
          `SELECT * FROM accounts WHERE email = $1`,
          [email]
        );

        if (existingUser.rows.length > 0) {
          // Utilizatorul există deja
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
            "google",
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


// Configurare Facebook OAuth (opțional, dacă ai nevoie)
passport.use(
  new FacebookStrategy(
    {
      clientID: "587989000683295", // Înlocuiește cu App ID
      clientSecret: "7360a0fdd26518cdfe5e382632e9fdde", // Înlocuiește cu App Secret
      callbackURL: "http://localhost:4000/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "picture.type(large)"], // Specifică ce informații dorești
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Verifică dacă email-ul există în profil
        const email = profile.emails?.[0]?.value || `facebook_${profile.id}@noemail.com`;

        // Setează o parolă temporară dacă este necesar
        const temporaryPassword = `facebook_${profile.id}`;

        // Verifică dacă utilizatorul există deja în baza de date
        const existingUser = await pool.query(
          `SELECT * FROM accounts WHERE email = $1`,
          [email]
        );

        if (existingUser.rows.length > 0) {
          // Utilizatorul există deja - returnează datele acestuia
          return done(null, existingUser.rows[0]);
        }

        // Creează un utilizator nou dacă nu există
        const newUser = await pool.query(
          `INSERT INTO accounts (first_name, last_name, email, profile_picture, password, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [
            profile.name.givenName || "Facebook User", // Prenume implicit dacă lipsește
            profile.name.familyName || "Unknown", // Nume implicit dacă lipsește
            email, // Email temporar
            profile.photos?.[0]?.value || null, // Imaginea de profil
            temporaryPassword, // Parolă temporară
          ]
        );

        // Returnează utilizatorul nou creat
        return done(null, newUser.rows[0]);
      } catch (err) {
        console.error("Error registering user with Facebook:", err);
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
      // Utilizatorul nu a fost găsit în baza de date
      return done(null, false); // Returnăm `false` pentru a indica că utilizatorul nu mai există
    }

    done(null, user.rows[0]); // Returnăm utilizatorul găsit
  } catch (err) {
    console.error("Error deserializing user:", err);
    done(err, null); // Returnăm eroarea
  }
});


module.exports = passport;
