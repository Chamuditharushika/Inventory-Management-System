import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSortAmountDown,
  FaFileExport,
  FaExclamationTriangle,
  FaSpinner,
  FaBox,
  FaTag,
  FaCalendar,
  FaCalendarAlt,
  FaThermometerHalf,
} from "react-icons/fa";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ Correct import

// Helper function outside component
const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    quantity: "",
    manufactureDate: "",
    expireDate: "",
    temperature: "",
    status: "Available",
  });
  const [editItem, setEditItem] = useState(null);
  const [warning, setWarning] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/api/inventory");
        setItems(response.data);
        setLowStockItems(
          response.data.filter((item) => Number(item.quantity) < 5)
        );
      } catch (error) {
        console.error("Error fetching items:", error);
        setWarning("Failed to fetch inventory items");
        setTimeout(() => setWarning(""), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  const toggleForm = () => {
    setShowForm(!showForm);
    if (showForm) {
      resetForm();
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prevItem) => ({
      ...prevItem,
      [name]: value,
    }));
  };

  const handleAddItem = async () => {
    try {
      // Validate required fields
      const requiredFields = ["name", "category", "quantity", "temperature"];
      const missingFields = requiredFields.filter((field) => !newItem[field]);

      if (missingFields.length > 0) {
        setWarning(
          `Please fill all required fields: ${missingFields.join(", ")}`
        );
        setTimeout(() => setWarning(""), 3000);
        return;
      }

      setIsLoading(true);

      if (editItem && editItem._id) {
        await axios.put(
          `http://localhost:5000/api/inventory/${editItem._id}`,
          newItem
        );
        setWarning("Item updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/inventory", newItem);
        setWarning("Item added successfully!");
      }

      // Refresh data
      const response = await axios.get("http://localhost:5000/api/inventory");
      setItems(response.data);
      setLowStockItems(
        response.data.filter((item) => Number(item.quantity) < 5)
      );

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      setWarning(
        error.response?.data?.message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => setWarning(""), 3000);
    }
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setNewItem({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      manufactureDate: item.manufactureDate?.split("T")[0] || "",
      expireDate: item.expireDate?.split("T")[0] || "",
      temperature: item.temperature,
      status: item.status || "Available",
    });
    setShowForm(true);
  };

  const handleDeleteItem = async (id) => {
    if (!id) {
      console.error("Item ID is missing");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      setIsLoading(true);
      await axios.delete(`http://localhost:5000/api/inventory/${id}`);
      const response = await axios.get("http://localhost:5000/api/inventory");
      setItems(response.data);
      setLowStockItems(
        response.data.filter((item) => Number(item.quantity) < 5)
      );
    } catch (error) {
      console.error("Error deleting item:", error);
      setWarning("Error deleting item. Please try again.");
      setTimeout(() => setWarning(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Inventory Report", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 25, {
      align: "center",
    });

    doc.setFontSize(14);
    doc.text("Summary", 14, 35);
    doc.setFontSize(10);
    doc.text(`Total Items: ${items.length}`, 14, 45);
    doc.text(`Low Stock Items: ${lowStockItems.length}`, 14, 55);
    doc.text(
      `Categories: ${[...new Set(items.map((item) => item.category))].length}`,
      14,
      65
    );

    doc.setFontSize(14);
    doc.text("Inventory Items", 14, 80);

    const tableData = items.map((item, index) => [
      index + 1,
      item.name,
      item.category,
      item.quantity,
      item.manufactureDate?.split("T")[0] || "N/A",
      item.expireDate?.split("T")[0] || "N/A",
      item.temperature,
      item.status,
    ]);

    autoTable(doc, {
      startY: 85,
      head: [
        [
          "Item #",
          "Name",
          "Category",
          "Qty",
          "Mfg Date",
          "Expiry Date",
          "Temp",
          "Status",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [54, 162, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 85 },
    });

    doc.save(`inventory_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    const dateA = new Date(a.manufactureDate);
    const dateB = new Date(b.manufactureDate);
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const resetForm = () => {
    setNewItem({
      name: "",
      category: "",
      quantity: "",
      manufactureDate: "",
      expireDate: "",
      temperature: "",
      status: "Available",
    });
    setEditItem(null);
  };

  const toggleLowStockModal = () => {
    setShowLowStockModal(!showLowStockModal);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex items-center space-x-3">
            <FaSpinner className="animate-spin text-orange-500 text-2xl" />
            <p className="text-gray-700 font-medium">Loading...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">
                  Total Items
                </h3>
                <p className="text-4xl font-bold text-gray-800">
                  {items.length}
                </p>
              </div>
              <div className="bg-orange-100/50 p-4 rounded-xl">
                <FaBox className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">
                  Low Stock Items
                </h3>
                <p className="text-4xl font-bold text-gray-800">
                  {lowStockItems.length}
                </p>
              </div>
              <div className="bg-red-100/50 p-4 rounded-xl">
                <FaExclamationTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">
                  Categories
                </h3>
                <p className="text-4xl font-bold text-gray-800">
                  {[...new Set(items.map((item) => item.category))].length}
                </p>
              </div>
              <div className="bg-blue-100/50 p-4 rounded-xl">
                <FaTag className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

      

        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-xl shadow-lg border border-white/10 mb-8 backdrop-blur-sm">
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-amber-100">
                <FaSearch className="text-lg" />
              </div>
              <input
                type="text"
                placeholder="Search inventory..."
                className="w-full pl-12 pr-4 py-3 border border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-amber-200 outline-none transition-all duration-300 bg-white/20 backdrop-blur-sm text-white placeholder-amber-100"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <button
                onClick={toggleSortOrder}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-300 border border-white/20 backdrop-blur-sm hover:shadow-md"
              >
                <FaSortAmountDown className="text-amber-200" />
                <span>Sort {sortOrder === "asc" ? "A→Z" : "Z→A"}</span>
              </button>
              <button
                onClick={toggleLowStockModal}
                className="flex items-center space-x-2 bg-red-400/90 hover:bg-red-500 px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-300 border border-red-300/30 backdrop-blur-sm hover:shadow-md"
              >
                <FaExclamationTriangle />
                <span>Low Stock</span>
              </button>
            </div>
          </div>

        
          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={toggleForm}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2 border border-white/20 hover:scale-[1.02]"
            >
              <FaPlus className="text-amber-200" />
              <span>Add New Item</span>
            </button>
            <button
              onClick={generatePDF}
              className="bg-white hover:bg-amber-50 text-amber-700 px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2 border border-amber-100 hover:scale-[1.02] shadow-md"
            >
              <FaFileExport />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-orange-600">
                  <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Manufacture Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Expire Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Temperature
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200">
                {sortedItems.length > 0 ? (
                  sortedItems.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-orange-50/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            item.quantity < 5
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.manufactureDate?.split("T")[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.expireDate?.split("T")[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.temperature}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            item.status === "Available"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-orange-600 hover:text-orange-900 p-2 rounded-full hover:bg-orange-50 transition"
                            title="Edit"
                          >
                            <FaEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition"
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
                    <td colSpan="8" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FaBox className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">
                          {search
                            ? "No matching items found"
                            : "No items in inventory"}
                        </p>
                        <p className="text-sm mt-1">
                          {!search && "Add your first item to get started"}
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

      {/* Add/Edit Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 p-6 flex justify-between items-center">
              <div className="text-white">
                <h2 className="text-2xl font-bold">
                  {editItem ? "Edit Item" : "Add New Item"}
                </h2>
                <p className="text-orange-100 text-sm mt-1">
                  {editItem
                    ? "Update item details"
                    : "Fill in the details to add a new item"}
                </p>
              </div>
              <button
                onClick={toggleForm}
                className="text-white hover:text-orange-100 p-2 rounded-full hover:bg-white/10 transition"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-orange-600 transition-colors">
                    Item Name*
                  </label>
                  <div className="relative">
                    <select
                      name="name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300"
                      value={newItem.name}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Item</option>
                      <option value="Milk">Milk</option>
                      <option value="Eggs">Eggs</option>
                      <option value="Bread">Bread</option>
                      <option value="Cheese">Cheese</option>
                      <option value="Butter">Butter</option>
                      <option value="Rice">Rice</option>
                      <option value="Sugar">Sugar</option>
                      <option value="Tea">Tea</option>
                      <option value="Coffee">Coffee</option>
                      <option value="Salt">Salt</option>
                      <option value="Flour">Flour</option>
                      <option value="Oil">Cooking Oil</option>
                      <option value="Soap">Soap</option>
                      <option value="Shampoo">Shampoo</option>
                      <option value="Toothpaste">Toothpaste</option>
                      <option value="Toilet Paper">Toilet Paper</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaBox className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-orange-600 transition-colors">
                    Category*
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300"
                      value={newItem.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Frozen">Frozen</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Grains">Grains</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Personal Care">Personal Care</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Health">Health</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaTag className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-orange-600 transition-colors">
                    Quantity*
                  </label>
                  <div className="relative">
                    <select
                      name="quantity"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300"
                      value={newItem.quantity}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Quantity</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaSortAmountDown className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-orange-600 transition-colors">
                    Manufacture Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="manufactureDate"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300"
                      value={newItem.manufactureDate}
                      onChange={handleInputChange}
                      max={getCurrentDate()}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaCalendar className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-orange-600 transition-colors">
                    Expire Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="expireDate"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300"
                      value={newItem.expireDate}
                      onChange={handleInputChange}
                      min={newItem.manufactureDate || getCurrentDate()}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaCalendarAlt className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-orange-600 transition-colors">
                    Temperature*
                  </label>
                  <div className="relative">
                    <select
                      name="temperature"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-orange-300"
                      value={newItem.temperature}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Storage Temperature</option>
                      <option value="Frozen (-18°C)">Frozen (-18°C)</option>
                      <option value="Refrigerated (0-4°C)">
                        Refrigerated (0-4°C)
                      </option>
                      <option value="Ambient">Ambient</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaThermometerHalf className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={toggleForm}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>{editItem ? "Updating..." : "Adding..."}</span>
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      <span>{editItem ? "Update Item" : "Add Item"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Items Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-cyan-600 rounded-xl shadow-xl w-full max-w-md">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Low Stock Items
              </h3>
              <button
                onClick={toggleLowStockModal}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                aria-label="Close low stock modal"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4">
              {lowStockItems.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {lowStockItems.map((item) => (
                    <li key={item._id} className="py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-sm text-amber-50">
                            Category: {item.category}
                          </p>
                          {item.location && (
                            <p className="text-sm text-gray-600">
                              Location: {item.location}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold leading-5 rounded-full bg-red-100 text-red-800">
                          {item.quantity} left
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FaExclamationTriangle className="mx-auto text-3xl text-gray-300 mb-2" />
                  <p>No low stock items</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={toggleLowStockModal}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Inventory;
