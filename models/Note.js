const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
  username: String,
  email: String,
  folder: String,
  title: String,
  description: String
});
module.exports = mongoose.model("Note", noteSchema);
