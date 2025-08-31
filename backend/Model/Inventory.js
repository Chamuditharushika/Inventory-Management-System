const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Item name is required"],
    enum: ["Milk", "Eggs", "Bread", "Cheese"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Dairy", "Bakery", "Frozen", "Beverages"],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  manufactureDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return !value || value <= new Date();
      },
      message: "Manufacture date cannot be in the future",
    },
  },
  expireDate: {
    type: Date,
    validate: {
      validator: function (value) {
        if (!value || !this.manufactureDate) return true;
        return value > this.manufactureDate;
      },
      message: "Expire date must be after manufacture date",
    },
  },
  temperature: {
    type: String,
    required: [true, "Temperature is required"],
    enum: ["Frozen (-18°C)", "Refrigerated (0-4°C)", "Ambient"],
  },
  status: {
    type: String,
    enum: ["Available", "Out of Stock"],
    default: "Available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
inventorySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;
