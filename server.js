require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/User");
const Note = require("./models/Note");
const validator = require("validator");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => res.sendFile("pages/index.html", { root: __dirname }));
app.get("/mynote", (req, res) => res.sendFile("pages/mynote.html", { root: __dirname }));
app.get("/about", (req, res) => res.sendFile("pages/about.html", { root: __dirname }));
app.get("/login", (req, res) => res.sendFile("pages/login.html", { root: __dirname }));
app.get("/signup", (req, res) => res.sendFile("pages/signup.html", { root: __dirname }));

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });
    const cleanEmail = email.trim();
    if (!validator.isEmail(cleanEmail))
      return res.status(400).json({ success: false, message: "Invalid email format!" });
    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ success: false, message: "User exist with same Email!" });
    const user = await User.create({ username, email: cleanEmail, password });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const notes = await Note.find({ email });
    res.json({ success: true, user, notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/getnote", async (req, res) => {
  try {
    const { email } = req.body;
    const notes = await Note.find({ email });
    res.json({ success: true, notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/addnote", async (req, res) => {
  try {
    const { email, title, description } = req.body;
    if (!email) return res.status(401).json({ success: false, message: "Login first" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Invalid login" });
    const note = await Note.create({ username: user.username, email, title, description });
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
