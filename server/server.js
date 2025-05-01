const http = require("http");
const { Server } = require("socket.io");
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
const favoritesRouter = require("./routes/favorites");
const followRoutes = require("./routes/follow");
const messagesRoutes = require("./routes/messages");
const likesRouter = require("./routes/likes");
const { router: appreciationRouter } = require("./routes/appreciationNotification");
const adminRoutes = require("./routes/admin/admin");
const statisticsRoutes = require("./routes/admin/statistics");

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

// Pornirea serverului
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutele aplicației
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/uploads", uploadRoutes);
app.use("/shop", shopRoutes);
app.use("/cart", cartRoutes);
app.use("/favorites", favoritesRouter);
app.use("/follows", followRoutes);
app.use("/messages", messagesRoutes);
app.use("/likes", likesRouter);
app.use("/appreciation", appreciationRouter);
app.use("/admin", adminRoutes);
app.use("/admin/statistics", statisticsRoutes);
app.use("/uploads", express.static("uploads"));


app.use("/", userRoutes);

// Socket.IO
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join", (userId) => {
    console.log(`Received join request for user: ${userId}`);
    socket.join(`user-${userId}`);
    console.log(`Joined room: user-${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
server.listen(4000, () => console.log("Server running on http://localhost:4000"));
