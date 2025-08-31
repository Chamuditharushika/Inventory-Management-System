const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./configuration/dbConfig");
const cors = require("cors");
const inventoryRoutes = require("./routes/inventoryRoutes");
const groceryRoutes = require("./routes/GroceryRoute/grocery");
const app = express();
const PORT = process.env.PORT || 5000; // Set PORT, with fallback

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/inventory", inventoryRoutes);
app.use("/api/groceries", groceryRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`);
});
