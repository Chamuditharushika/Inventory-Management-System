// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaShoppingCart,
  FaBox,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 min-h-screen bg-gradient-to-b from-white to-orange-50 shadow-xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-orange-100">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your inventory</p>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link
              to="/grocery-list"
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive("/grocery-list")
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              <FaShoppingCart
                className={`w-5 h-5 mr-3 ${
                  isActive("/grocery-list")
                    ? "text-white"
                    : "text-orange-500 group-hover:text-orange-600"
                }`}
              />
              <span className="font-medium">Grocery List</span>
            </Link>
          </li>
          <li>
            <Link
              to="/inventory"
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive("/inventory")
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              <FaBox
                className={`w-5 h-5 mr-3 ${
                  isActive("/inventory")
                    ? "text-white"
                    : "text-orange-500 group-hover:text-orange-600"
                }`}
              />
              <span className="font-medium">Inventory</span>
            </Link>
          </li>
          <li>
            <Link
              to="/analytics"
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive("/analytics")
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              <FaChartLine
                className={`w-5 h-5 mr-3 ${
                  isActive("/analytics")
                    ? "text-white"
                    : "text-orange-500 group-hover:text-orange-600"
                }`}
              />
              <span className="font-medium">Analytics</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-orange-100">
        <ul className="space-y-2">
          <li>
            <Link
              to="/settings"
              className="flex items-center px-4 py-3 rounded-xl text-gray-600 hover:bg-orange-50 transition-all duration-300 group"
            >
              <FaCog className="w-5 h-5 mr-3 text-gray-400 group-hover:text-orange-500" />
              <span className="font-medium">Settings</span>
            </Link>
          </li>
          <li>
            <button
              onClick={() => {
                /* Add logout logic */
              }}
              className="w-full flex items-center px-4 py-3 rounded-xl text-gray-600 hover:bg-orange-50 transition-all duration-300 group"
            >
              <FaSignOutAlt className="w-5 h-5 mr-3 text-gray-400 group-hover:text-orange-500" />
              <span className="font-medium">Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
