require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
 
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
 
// ------------------------
// MongoDB Connection
// ------------------------
const mongoURI = process.env.MONGO_URI || "your-mongodb-uri";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log("Connected to MongoDB");
 
// ------------------------
// Mongoose Models
// ------------------------
const bookSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  isbn: String,
});
const Book = mongoose.model("Book", bookSchema);
 
const userSchema = new mongoose.Schema({
  userid: String,
  username: String,
  password: String,
  profilePic: String,
  bookshelves: {
    read: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
    currentlyReading: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
    toRead: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
  },
});
const User = mongoose.model("User", userSchema);
 
const replySchema = new mongoose.Schema({
  username: { type: String, default: "Anonymous" },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
 
const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  user: { type: String, default: "Anonymous" },
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema],
});
const Discussion = mongoose.model("Discussion", discussionSchema);
 
// ------------------------
// Cloudinary Configuration
// ------------------------
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
 
// ------------------------
// JWT Authentication Middleware
// ------------------------
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};
 
// ------------------------
// Multer Config for Profile Image Upload
// ------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });
 
// ------------------------
// Auth Routes
// ------------------------
app.post("/api/auth/signup", async (req, res) => {
  const { userid, username, password } = req.body;
  const existingUser = await User.findOne({ userid });
  if (existingUser)
    return res.status(409).json({ message: "User already exists" });
 
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ userid, username, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: "User created successfully" });
});
 
app.post("/api/auth/login", async (req, res) => {
  const { userid, password } = req.body;
  const user = await User.findOne({ userid });
  if (!user) return res.status(404).json({ message: "User not found" });
 
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(401).json({ message: "Invalid credentials" });
 
  const token = jwt.sign({ userid: user.userid }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });
  res.json({ token, userid: user.userid, username: user.username });
});
 
// ------------------------
// User Routes
// ------------------------
app.get("/api/users/:id", authenticate, async (req, res) => {
  const user = await User.findOne({ userid: req.params.id });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});
 
app.patch("/api/users/:userId/username", authenticate, async (req, res) => {
  const user = await User.findOneAndUpdate(
    { userid: req.params.userId },
    { username: req.body.username },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});
 
app.post(
  "/api/users/:id/profile-pic",
  authenticate,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const result = await cloudinary.uploader.upload(req.file.path);
      const user = await User.findOne({ userid: req.params.id });
      if (!user) return res.status(404).json({ message: "User not found" });
 
      user.profilePic = result.secure_url;
      await user.save();
      res.json({ message: "Upload successful", filePath: user.profilePic });
    } catch (err) {
      res.status(500).json({ message: "Upload failed", error: err.message });
    }
  }
);
 
// ------------------------
// Book Routes
// ------------------------
app.post("/api/library", authenticate, async (req, res) => {
  const { title, imageUrl, isbn } = req.body;
  const existing = await Book.findOne({ isbn });
  if (existing)
    return res.status(409).json({ message: "Book already exists in library." });
 
  const book = new Book({ title, imageUrl, isbn });
  await book.save();
  res.status(201).json(book);
});
 
app.get("/api/library", async (req, res) => {
  const books = await Book.find();
  res.json(books);
});
 
// ------------------------
// Bookshelf Routes
// ------------------------
app.get("/api/users/:id/bookshelves", authenticate, async (req, res) => {
  const user = await User.findOne({ userid: req.params.id })
    .populate("bookshelves.read")
    .populate("bookshelves.currentlyReading")
    .populate("bookshelves.toRead");
 
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.bookshelves);
});
 
app.post("/api/users/:id/add-book", authenticate, async (req, res) => {
  const { bookId, shelf } = req.body;
  const user = await User.findOne({ userid: req.params.id });
  if (!user) return res.status(404).json({ message: "User not found" });
 
  if (user.bookshelves[shelf].includes(bookId))
    return res.status(400).json({ message: "Already in this shelf" });
 
  user.bookshelves[shelf].push(bookId);
  await user.save();
  res.json({ message: "Book added to shelf successfully" });
});
 
app.patch("/api/users/:id/move-book", authenticate, async (req, res) => {
  const { bookId, fromShelf, toShelf } = req.body;
  const user = await User.findOne({ userid: req.params.id });
  if (!user) return res.status(404).json({ message: "User not found" });
 
  user.bookshelves[fromShelf] = user.bookshelves[fromShelf].filter(
    (id) => id.toString() !== bookId
  );
  user.bookshelves[toShelf].push(bookId);
  await user.save();
  res.json({ message: "Book moved successfully" });
});
 
// ------------------------
// Discussion Routes
// ------------------------
app.post("/api/discussions", authenticate, async (req, res) => {
  const { title, content, user } = req.body;
  if (!title || !content)
    return res.status(400).json({ message: "Title and content required" });
 
  const newDiscussion = new Discussion({ title, content, user });
  const savedDiscussion = await newDiscussion.save();
  res.status(201).json(savedDiscussion);
});
 
app.get("/api/discussions", async (req, res) => {
  const discussions = await Discussion.find().sort({ createdAt: -1 });
  res.json(discussions);
});
 
app.post("/api/discussions/:id/replies", authenticate, async (req, res) => {
  const { username, content } = req.body;
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion)
    return res.status(404).json({ message: "Discussion not found" });
 
  discussion.replies.push({ username, content });
  await discussion.save();
  res.status(201).json(discussion);
});
 
// ------------------------
// Start Server
// ------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT,'0.0.0.0',() => {
  console.log(`Server running on port ${PORT}`);
});