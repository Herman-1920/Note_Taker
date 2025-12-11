const mongoose = require("mongoose");

const FolderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true }
});

module.exports = mongoose.model("Folder", FolderSchema);
