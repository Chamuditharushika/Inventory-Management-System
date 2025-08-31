const express = require("express");
const router = express.Router();
const groceryController = require("../../controllers/GroceryController/groceryController");

router.get("/", groceryController.getAllGroceries);

router.post("/", groceryController.addGrocery);

router.put("/:id", groceryController.updateGrocery);

router.delete("/:id", groceryController.deleteGrocery);

module.exports = router;
