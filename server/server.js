const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport-config");
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts"); 
const uploadRoutes = require("./routes/uploads");
const shopRoutes = require("./routes/shop");
const cartRoutes = require("./routes/cart");



const app = express();

// Middleware-uri
app.use(express.json());
app.use(cors());
app.use(
  session({
    secret: "d4f1b2e5d8c5fba3a2f2d1e4c3b7a8f6c7d9e0a1b5c4d3e2f8a9b6e7f1d0c3a5",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/uploads", express.static("uploads"));


app.use("/", userRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes); 
app.use("/uploads", uploadRoutes);
app.use("/shop", shopRoutes);
app.use("/cart", cartRoutes);

// Pornirea serverului
app.listen(4000, () => console.log("Server running on http://localhost:4000"));
