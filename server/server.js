const http = require("http");// server HTTP
const { Server } = require("socket.io");//
const express = require("express");
const cors = require("cors");//  cereri CORS
const session = require("express-session");
const passport = require("./config/passport-config");//  autentificare
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

app.use(express.json()); // Pt a putea procesa JSON din request-uri
app.use(cors()); // Permite aplicației frontend (aflată pe alt domeniu/port) să facă cereri HTTP către acest server
app.use(
  session({
    secret: process.env.SESSION_SECRET, 
    resave: false, // Nu rescrie sesiunea daca nu s-a modificat
    saveUninitialized: true,// Salveaza sesiunea chiar daca nu este initializata
  })
); // Middleware pentru sesiuni
app.use(passport.initialize()); // Initializare Passport pentru autentificare
app.use(passport.session()); // Middleware pentru gestionarea sesiunilor Passport

// Pornirea serverului
const server = http.createServer(app); // Crearea serverului HTTP din aplicatia Express
// Configurarea Socket.IO
// Foloseste serverul HTTP creat anterior pentru a permite comunicarea in timp real
const io = new Server(server, {
  cors: {
    origin: "*", // Permite orice origine (pentru dezvoltare, in productie ar trebui restrictionat)
    methods: ["GET", "POST"] // permise
  }
});
// Middleware pentru a adauga obiectul io la request-uri
// Acest lucru permite accesul la socket.io in rutele aplicatiei
app.use((req, res, next) => {
  req.io = io; // Adauga obiectul io la request-uri
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
app.use("/uploads", express.static("uploads")); // Serveste fisierele stocate local in "uploads" (doar daca nu se foloseste exclusiv Cloudinary)
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
