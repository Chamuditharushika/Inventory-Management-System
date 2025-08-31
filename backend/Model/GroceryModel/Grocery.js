const mongoose = require("mongoose");

const grocerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  category: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  archived: {
    type: Boolean,
    default: false,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
});

const Grocery = mongoose.model("Grocery", grocerySchema);

module.exports = Grocery;
