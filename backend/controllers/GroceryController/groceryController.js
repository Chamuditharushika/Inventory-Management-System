const Grocery = require("../../Model/GroceryModel/Grocery");

// Get all non-archived groceries
exports.getAllGroceries = async (req, res) => {
  try {
    const groceries = await Grocery.find({ archived: false }).sort({
      dateAdded: -1,
    });
    res.json(groceries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all archived groceries
exports.getArchivedGroceries = async (req, res) => {
  try {
    const groceries = await Grocery.find({ archived: true }).sort({
      dateAdded: -1,
    });
    res.json(groceries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add new grocery item
exports.addGrocery = async (req, res) => {
  const { name, quantity, category } = req.body;

  try {
    const newGrocery = new Grocery({
      name,
      quantity,
      category,
    });

    const grocery = await newGrocery.save();
    res.status(201).json(grocery);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update grocery item
exports.updateGrocery = async (req, res) => {
  const { name, quantity, category, completed, archived } = req.body;

  try {
    let grocery = await Grocery.findById(req.params.id);
    if (!grocery) return res.status(404).json({ message: "Item not found" });

    grocery.name = name || grocery.name;
    grocery.quantity = quantity || grocery.quantity;
    grocery.category = category || grocery.category;
    grocery.completed = completed !== undefined ? completed : grocery.completed;
    grocery.archived = archived !== undefined ? archived : grocery.archived;

    const updatedGrocery = await grocery.save();
    res.json(updatedGrocery);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete grocery item
exports.deleteGrocery = async (req, res) => {
  try {
    const grocery = await Grocery.findById(req.params.id);
    if (!grocery) return res.status(404).json({ message: "Item not found" });

    await Grocery.deleteOne({ _id: req.params.id });
    res.json({ message: "Item removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error deleting item",
      error: err.message,
    });
  }
};

// Mark all pending items as purchased and archive them
exports.purchaseAllPending = async (req, res) => {
  try {
    // Find all pending, non-archived items
    const pendingItems = await Grocery.find({
      completed: false,
      archived: false,
    });

    if (pendingItems.length === 0) {
      return res.status(400).json({ message: "No pending items to purchase" });
    }

    // Update all pending items to be completed and archived
    const result = await Grocery.updateMany(
      { _id: { $in: pendingItems.map((item) => item._id) } },
      { $set: { completed: true, archived: true } }
    );

    res.json({
      message: `${result.modifiedCount} items marked as purchased and archived`,
      purchasedItems: pendingItems.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
