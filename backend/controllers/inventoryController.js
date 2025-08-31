const Inventory = require("../Model/Inventory");

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Public
exports.getInventory = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Server error while fetching inventory" });
  }
};

// @desc    Add new inventory item
// @route   POST /api/inventory
// @access  Public
exports.addItem = async (req, res) => {
  try {
    const {
      name,
      category,
      quantity,
      manufactureDate,
      expireDate,
      temperature,
      status,
    } = req.body;

    // Basic validation
    if (!name || !category || !quantity || !temperature) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const newItem = new Inventory({
      name,
      category,
      quantity: Number(quantity),
      manufactureDate: manufactureDate || null,
      expireDate: expireDate || null,
      temperature,
      status: status || "Available",
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error("Error adding inventory item:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: "Server error while adding item" });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Public
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      quantity,
      manufactureDate,
      expireDate,
      temperature,
      status,
    } = req.body;

    // Basic validation
    if (!name || !category || !quantity || !temperature) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      {
        name,
        category,
        quantity: Number(quantity),
        manufactureDate: manufactureDate || null,
        expireDate: expireDate || null,
        temperature,
        status: status || "Available",
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Error updating inventory item:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: "Server error while updating item" });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Public
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await Inventory.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ message: "Server error while deleting item" });
  }
};
