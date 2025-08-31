// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import GroceryList from "./components/GroceryList/GroceryList";
import Inventory from "./components/Inventory/Inventory";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar Navigation */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-4">
          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard Overview */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Grocery List Page */}
            <Route path="/grocery-list" element={<GroceryList />} />
            
            {/* Inventory Management Page */}
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;