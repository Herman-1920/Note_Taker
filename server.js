require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/User");
const Note = require("./models/Note");
const Folder = require("./models/Folder");
const validator = require("validator");

const app = express();
const port = process.env.PORT || 3000;

//  Middleware
app.use(express.static(path.join(__dirname, "public"))); //makes the public folder inside 
// the project accessible to the browser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));//parse data 

// Database Connection 
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

//  Page Routes 
app.get("/", (req, res) => res.sendFile("pages/index.html", { root: __dirname }));
app.get("/mynote", (req, res) => res.sendFile("pages/mynote.html", { root: __dirname }));
app.get("/about", (req, res) => res.sendFile("pages/about.html", { root: __dirname }));
app.get("/login", (req, res) => res.sendFile("pages/login.html", { root: __dirname }));
app.get("/signup", (req, res) => res.sendFile("pages/signup.html", { root: __dirname }));

//  Signup 
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;   
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    const cleanEmail = email.trim();    
    if (!validator.isEmail(cleanEmail))
      return res.status(400).json({ success: false, message: "Invalid email format!" });

    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({ success: false, message: "User exist with same Email!" });

    const user = await User.create({ username, email: cleanEmail, password });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//  Login 
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const notes = await Note.find({ email });
    res.json({ success: true, user, notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get note
app.post("/getnote", async (req, res) => {
  try {
    const { email } = req.body;
    const notes = await Note.find({ email });
    res.json({ success: true, notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add note
app.post("/addnote", async (req, res) => {
  try {
    const { email, title, description, folder } = req.body;

    if (!email)
      return res.status(401).json({ success: false, message: "Login first" });

    if (!folder)
      return res.status(400).json({ success: false, message: "Folder required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid login" });

    const note = await Note.create({
      username: user.username,
      email,
      title,
      description,
      folder
    });

    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Edit note
app.post("/editnote", async (req, res) => {
  try {
    const { id, title, description, folder } = req.body;
    if (!id)
      return res.status(400).json({ success: false, message: "Note id required" });

    const note = await Note.findByIdAndUpdate(
      id,
      { title, description, folder },
      { new: true }
    );

    if (!note)
      return res.status(404).json({ success: false, message: "Note not found" });

    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete note
app.post("/deletenote", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id)
      return res.status(400).json({ success: false, message: "Note id required" });

    await Note.findByIdAndDelete(id);
    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get folder
app.post("/getfolders", async (req, res) => {
  try {
    const { email } = req.body;
    const folders = await Folder.find({ email });
    res.json({ success: true, folders: folders.map(f => f.name) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add folder
app.post("/addfolder", async (req, res) => {
  try {
    const { email, folder } = req.body;
    if (!email || !folder)
      return res.status(400).json({ success: false, message: "Email and folder required" });

    const exists = await Folder.findOne({ email, name: folder });
    if (exists)
      return res.json({ success: false, message: "Folder already exists" });

    await Folder.create({ email, name: folder });
    res.json({ success: true, message: "Folder added" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete folder 
app.post("/deletefolder", async (req, res) => {
  try {
    const { email, folder } = req.body;
    if (!email || !folder)
      return res.status(400).json({ success: false, message: "Email and folder required" });

    await Folder.deleteOne({ email, name: folder });
    await User.updateOne({ email }, { $pull: { folders: { name: folder } } });
    await Note.deleteMany({ email, folder });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start Server 
app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
