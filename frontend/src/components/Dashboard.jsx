import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="p-3 border-b border-gray-100">
              <p className="text-gray-600">Added 5 apples to grocery list</p>
              <p className="text-sm text-gray-400">2 hours ago</p>
            </div>
            <div className="p-3 border-b border-gray-100">
              <p className="text-gray-600">Updated milk stock to 30 units</p>
              <p className="text-sm text-gray-400">Yesterday</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          System Stats
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-600">Total Items</h3>
            <p className="text-2xl font-bold">24</p>
          </div>
          <div className="p-4 bg-green-50 rounded-md">
            <h3 className="font-medium text-green-600">Low Stock Items</h3>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-md">
            <h3 className="font-medium text-purple-600">Categories</h3>
            <p className="text-2xl font-bold">5</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
