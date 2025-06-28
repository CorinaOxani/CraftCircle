const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport-config");
require("dotenv").config();


const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts"); 
const uploadRoutes = require("./routes/uploads");
const shopRoutes = require("./routes/shop");
const cartRoutes = require("./routes/cart");
const favoritesRouter = require("./routes/favorites");
const messagesRoutes = require("./routes/messages");
const likesRouter = require("./routes/likes");
const { router: appreciationRouter } = require("./routes/appreciationNotification");
const adminRoutes = require("./routes/admin/admin");
const statisticsRoutes = require("./routes/admin/statistics");
const categoryRoutes = require("./routes/admin/categories");
const moderatePostsRoutes = require("./routes/admin/moderatePosts");
const moderateProductsRoutes = require("./routes/admin/moderateProducts");
const adminStatistics = require("./routes/admin/statistics");
const moderateOrdersRoutes = require("./routes/admin/moderateOrders");
const moderateUsersRoutes = require("./routes/admin/moderateUsers");
const orderRoutes = require("./routes/orders");
const stripeRoutes = require("./routes/stripe");
const discoverPostsRoute = require("./routes/discoverPosts");
const discoverProductsRoute = require("./routes/discoverProducts");



const app = express();

// Middleware-uri
app.use(express.json());
app.use(cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

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

const followRoutes = require("./routes/follow")(io); 
const commentsRoutes = require("./routes/comments")(io);
// Rutele aplicatiei
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
app.use("/orders", orderRoutes);
app.use("/stripe", stripeRoutes);
app.use("/discover", discoverPostsRoute);
app.use("/discover", discoverProductsRoute);
app.use("/comments", commentsRoutes);
app.use("/admin", adminRoutes);
app.use("/uploads", express.static("uploads")); //// Serveste fisierele stocate local in "uploads" (doar daca nu se foloseste exclusiv Cloudinary)
app.use("/admin/categories", categoryRoutes);
app.use("/admin/moderatePosts", moderatePostsRoutes);
app.use("/admin/moderateProducts", moderateProductsRoutes);
app.use("/admin/moderateUsers", moderateUsersRoutes);
app.use("/moderateOrders", moderateOrdersRoutes);
app.use("/admin/statistics", adminStatistics);

app.use("/", userRoutes);

// Socket.IO
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

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
