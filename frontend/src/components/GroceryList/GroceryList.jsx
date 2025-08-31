import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaShoppingCart,
  FaPlus,
  FaSearch,
  FaChartLine,
  FaStar,
  FaRegStar,
  FaTag,
  FaBox,
  FaTruck,
} from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

Chart.register(...registerables);

const GroceryList = () => {
  const [groceries, setGroceries] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    category: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    quantity: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showTable, setShowTable] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
  });

  // Define categories with their units
  const categoryUnits = {
    Vegetables: "kg",
    Fruits: "kg",
    "Meat & Fish": "kg",
    "Dairy Products": "units",
    Beverages: "units",
    Snacks: "units",
    "Household Items": "units",
    "Personal Care": "units",
    Spices: "units",
    Other: "units",
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const categories = [
    ...new Set(groceries.map((item) => item.category || "Uncategorized")),
  ];

  // Fetch groceries from backend
  useEffect(() => {
    const fetchGroceries = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/groceries");
        const itemsWithDates = res.data.map((item) => ({
          ...item,
          createdAt: item.createdAt || new Date().toISOString(),
        }));
        setGroceries(itemsWithDates);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroceries();
  }, []);

  // Update filtered items when filters change
  useEffect(() => {
    const filtered = groceries.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "pending" && !item.completed) ||
        (activeTab === "purchased" && item.completed) ||
        activeTab === item.category;
      return matchesSearch && matchesTab;
    });
    setFilteredItems(filtered);
  }, [groceries, searchTerm, activeTab]);

  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: "" }), 3000);
  };

  const validateItemName = (name) => {
    if (!name.trim()) {
      return "Item name is required";
    }
    if (name.length < 2) {
      return "Item name must be at least 2 characters long";
    }
    if (name.length > 50) {
      return "Item name cannot exceed 50 characters";
    }
    if (/\d/.test(name)) {
      return "Item name cannot contain numbers";
    }
    if (!/^[a-zA-Z\s-']+$/.test(name)) {
      return "Item name can only contain letters, spaces, hyphens, and apostrophes";
    }
    return "";
  };

  const validateQuantity = (quantity, category) => {
    if (!quantity) {
      return "Quantity is required";
    }
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity)) {
      return "Quantity must be a number";
    }
    if (numQuantity <= 0) {
      return "Quantity must be greater than 0";
    }

    // Different validation for weight-based items (kg) vs unit-based items
    if (categoryUnits[category] === "kg") {
      if (numQuantity > 100) {
        return "Weight cannot exceed 100 kg";
      }
      if (numQuantity < 0.1) {
        return "Weight must be at least 0.1 kg";
      }
    } else {
      if (numQuantity > 20) {
        return "Quantity cannot exceed 20 units";
      }
    }
    return "";
  };

  const addItem = async () => {
    // Validate fields
    const nameError = validateItemName(newItem.name);
    const quantityError = validateQuantity(newItem.quantity, newItem.category);

    setErrors({
      name: nameError,
      quantity: quantityError,
    });

    if (nameError || quantityError) {
      showNotification("Please fix the errors in the form");
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const itemWithDate = {
        ...newItem,
        completed: false,
        dateAdded: today,
        unit: categoryUnits[newItem.category] || "units",
      };
      const res = await axios.post(
        "http://localhost:5000/api/groceries",
        itemWithDate
      );
      setGroceries([res.data, ...groceries]);
      setNewItem({ name: "", quantity: "", category: "" });
      setErrors({ name: "", quantity: "" });
      showNotification(`${newItem.name} added to grocery list`);
    } catch (err) {
      console.error(err);
      showNotification("Failed to add item. Please try again.");
    }
  };

  const updateItem = async () => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/groceries/${itemToEdit._id}`,
        itemToEdit
      );
      setGroceries(
        groceries.map((item) => (item._id === itemToEdit._id ? res.data : item))
      );
      setIsModalOpen(false);
      setItemToEdit(null);
      showNotification(`${itemToEdit.name} updated successfully`);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${name}?`
    );
    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:5000/api/groceries/${id}`);
        setGroceries(groceries.filter((item) => item._id !== id));
        showNotification(`${name} removed from grocery list`);
      } catch (err) {
        console.error("Error deleting item:", err);
        showNotification("Failed to delete item. Please try again.");
      }
    }
  };

  const toggleComplete = async (id, currentStatus, name) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/groceries/${id}`, {
        completed: !currentStatus,
      });
      setGroceries(
        groceries.map((item) => (item._id === id ? res.data : item))
      );
      showNotification(
        `${name} marked as ${!currentStatus ? "purchased" : "pending"}`
      );
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (item) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const saveEditedItem = () => {
    updateItem();
  };

  const buyItems = () => {
    showNotification("Items marked as purchased");
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    doc.setFillColor(40, 53, 147);
    doc.rect(0, 0, pageWidth, 20, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("GROCERY LIST REPORT", pageWidth / 2, 13, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text(`Report generated on: ${date} at ${time}`, margin, 30);

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.text(
      "This report provides a detailed list of all grocery items, their status, quantities, and categories.",
      margin,
      40
    );

    const headers = [
      ["#", "Status", "Item Name", "Quantity", "Category", "Date Added"],
    ];
    const data = filteredItems.map((item, index) => [
      index + 1,
      item.completed ? "✓ Purchased" : "○ Pending",
      item.name,
      item.quantity,
      item.category || "Uncategorized",
      formatDate(item.createdAt),
    ]);

    autoTable(doc, {
      startY: 50,
      head: headers,
      body: data,
      theme: "grid",
      headStyles: {
        fillColor: [40, 53, 147],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [60, 60, 60],
      },
      styles: {
        cellPadding: 3,
        overflow: "linebreak",
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "center", cellWidth: 20 },
        2: { cellWidth: 50 },
        3: { halign: "center", cellWidth: 20 },
        4: { cellWidth: 40 },
        5: { cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Generated by Grocery Management System",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    doc.save(`Grocery-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
    showNotification("✅ Professional PDF report generated successfully!");
  };

  const chartData = {
    itemsByCategory: {
      labels: categories,
      datasets: [
        {
          label: "Items by Category",
          data: categories.map(
            (cat) => groceries.filter((item) => item.category === cat).length
          ),
          backgroundColor: categories.map(
            (_, i) => `hsl(${(i * 360) / categories.length}, 70%, 50%)`
          ),
          borderColor: categories.map(
            (_, i) => `hsl(${(i * 360) / categories.length}, 70%, 30%)`
          ),
          borderWidth: 1,
        },
      ],
    },
    quantitiesByCategory: {
      labels: categories,
      datasets: [
        {
          label: "Total Quantity by Category",
          data: categories.map((cat) =>
            groceries
              .filter((item) => item.category === cat)
              .reduce((sum, item) => sum + parseInt(item.quantity || 0), 0)
          ),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
  };

  const inventory = groceries.filter((item) => item.quantity < 3).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
      {notification.show && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in-down">
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-blue-500 via-blue-500 to-blue-800 rounded-3xl p-8 mb-8 shadow-2xl transform hover:scale-[1.01] transition-all duration-300">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white mb-6 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
                Grocery Management
              </h1>
              <p className="text-orange-100 text-lg">
                Manage your shopping list efficiently
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={generatePDF}
                className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition-all duration-300 flex items-center space-x-2 border border-white/20"
              >
                <FaFilePdf />
                <span>Export List</span>
              </button>
              <button
                onClick={buyItems}
                className="bg-white text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-orange-50 transition-all duration-300 flex items-center space-x-2 shadow-lg"
              >
                <FaShoppingCart />
                <span>Buy Items</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards with Glass Effect */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">
                  Total Items
                </h3>
                <p className="text-4xl font-bold text-gray-800">
                  {groceries.length}
                </p>
              </div>
              <div className="bg-orange-100/50 p-4 rounded-xl">
                <FaBox className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <FaTruck className="mr-2" />
              <span>Ready for delivery</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">
                  Pending
                </h3>
                <p className="text-4xl font-bold text-gray-800">
                  {groceries.filter((item) => !item.completed).length}
                </p>
              </div>
              <div className="bg-blue-100/50 p-4 rounded-xl">
                <FaTag className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <FaRegStar className="mr-2" />
              <span>Items to purchase</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">
                  Categories
                </h3>
                <p className="text-4xl font-bold text-gray-800">
                  {categories.length}
                </p>
              </div>
              <div className="bg-green-100/50 p-4 rounded-xl">
                <FaStar className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <FaChartLine className="mr-2" />
              <span>Active categories</span>
            </div>
          </div>
        </div>

        {/* Add New Item Form with Glass Effect */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-orange-300 rounded-full -ml-24 -mb-24 opacity-20"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Add New Item
                </h2>
                <p className="text-gray-600">
                  Fill in the details to add a new item to your grocery list
                </p>
              </div>
              <div className="bg-orange-100/50 p-4 rounded-xl">
                <FaPlus className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 group">
                <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-orange-600 transition-colors">
                  Item Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter item name (letters only)"
                    value={newItem.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow letters, spaces, hyphens, and apostrophes
                      const sanitizedValue = value.replace(
                        /[^a-zA-Z\s-']/g,
                        ""
                      );
                      setNewItem({ ...newItem, name: sanitizedValue });
                      setErrors({
                        ...errors,
                        name: validateItemName(sanitizedValue),
                      });
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      setNewItem({ ...newItem, name: value });
                      setErrors({ ...errors, name: validateItemName(value) });
                    }}
                    className={`w-full border-2 ${
                      errors.name ? "border-red-500" : "border-gray-200"
                    } rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaBox
                      className={`h-5 w-5 ${
                        errors.name
                          ? "text-red-500"
                          : "text-gray-400 group-hover:text-orange-500"
                      } transition-colors`}
                    />
                  </div>
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.name}
                  </p>
                )}
                {!errors.name && newItem.name && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    Valid item name
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-orange-600 transition-colors">
                  Quantity{" "}
                  {newItem.category && `(${categoryUnits[newItem.category]})`}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={
                      newItem.category &&
                      categoryUnits[newItem.category] === "kg"
                        ? "0.1"
                        : "1"
                    }
                    max={
                      newItem.category &&
                      categoryUnits[newItem.category] === "kg"
                        ? "100"
                        : "20"
                    }
                    step={
                      newItem.category &&
                      categoryUnits[newItem.category] === "kg"
                        ? "0.1"
                        : "1"
                    }
                    placeholder={`Enter quantity in ${
                      newItem.category
                        ? categoryUnits[newItem.category]
                        : "units"
                    }`}
                    value={newItem.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewItem({ ...newItem, quantity: value });
                      setErrors({
                        ...errors,
                        quantity: validateQuantity(value, newItem.category),
                      });
                    }}
                    className={`w-full border-2 ${
                      errors.quantity ? "border-red-500" : "border-gray-200"
                    } rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaTag
                      className={`h-5 w-5 ${
                        errors.quantity
                          ? "text-red-500"
                          : "text-gray-400 group-hover:text-orange-500"
                      } transition-colors`}
                    />
                  </div>
                </div>
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.quantity}
                  </p>
                )}
                {!errors.quantity && newItem.quantity && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    Valid quantity
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-orange-600 transition-colors">
                  Category
                </label>
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const category = e.target.value;
                      setNewItem({ ...newItem, category, quantity: "" }); // Reset quantity when category changes
                      setErrors({ ...errors, quantity: "" }); // Reset quantity error
                    }}
                    value={newItem.category}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300 appearance-none"
                  >
                    <option value="">Select Category</option>
                    {Object.keys(categoryUnits).map((cat, index) => (
                      <option key={index} value={cat}>
                        {cat} ({categoryUnits[cat]})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaStar className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={addItem}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!!errors.name || !!errors.quantity}
              >
                <FaPlus className="text-lg" />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === "all"
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === "pending"
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("purchased")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === "purchased"
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Purchased
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === cat
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            />
          </div>
        </div>

        {/* Table Toggle Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowTable(!showTable)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-1"
          >
            <FaShoppingCart className="text-lg" />
            <span>{showTable ? "Hide Items Table" : "Show Items Table"}</span>
          </button>
        </div>

        {/* Items Table with Glass Effect */}
        <div
          className={`transition-all duration-500 ease-in-out transform ${
            showTable
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Date Added
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr
                        key={item._id}
                        className={`hover:bg-orange-50/50 transition-colors duration-200 ${
                          item.completed ? "bg-green-50/50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() =>
                              toggleComplete(
                                item._id,
                                item.completed,
                                item.name
                              )
                            }
                            className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`font-medium ${
                                item.completed
                                  ? "text-gray-500 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              item.completed
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            {item.category || "Uncategorized"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="text-orange-600 hover:text-orange-900 p-1 rounded-full hover:bg-orange-50 transition"
                              title="Edit"
                            >
                              <FaEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => deleteItem(item._id, item.name)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition"
                              title="Delete"
                            >
                              <FaTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center justify-center py-8">
                          <FaShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium text-gray-600">
                            No items found
                          </p>
                          <p className="text-sm text-gray-500">
                            Add some items to your grocery list
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isModalOpen && itemToEdit && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Edit Item
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={itemToEdit.name}
                      onChange={(e) =>
                        setItemToEdit({ ...itemToEdit, name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={itemToEdit.quantity}
                      onChange={(e) =>
                        setItemToEdit({
                          ...itemToEdit,
                          quantity: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={itemToEdit.category}
                      onChange={(e) =>
                        setItemToEdit({
                          ...itemToEdit,
                          category: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    >
                      <option value="">Select Category</option>
                      {[
                        "Vegetables",
                        "Fruits",
                        "Dairy Products",
                        "Meat & Fish",
                        "Beverages",
                        "Snacks",
                        "Household Items",
                        "Personal Care",
                        "Spices",
                        "Other",
                      ].map((cat, index) => (
                        <option key={index} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditedItem}
                    className="px-4 py-2 bg-orange-600 rounded-lg text-white font-medium hover:bg-orange-700 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroceryList;
