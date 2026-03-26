import { useManagerStats } from "../hooks/useManagerStats";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

export default function ManagerStatsPage() {
  const { data: stats, isLoading } = useManagerStats();

  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading stats...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        No data available
      </div>
    );
  }

  const pieData = [
    { name: "Pending", value: stats.pending_orders },
    { name: "Preparing", value: stats.preparing_orders },
    { name: "Ready", value: stats.ready_orders },
    { name: "Completed", value: stats.completed_orders },
  ];

  const barData = [
    { name: "Pending", orders: stats.pending_orders },
    { name: "Preparing", orders: stats.preparing_orders },
    { name: "Ready", orders: stats.ready_orders },
    { name: "Completed", orders: stats.completed_orders },
  ];

  const COLORS = ["#facc15", "#60a5fa", "#4ade80", "#9ca3af"];

  return (
    <div className="bg-black text-white min-h-screen p-4">
      <h1 className="text-xl font-semibold mb-1">
        {stats.canteen_name}
      </h1>
      <p className="text-xs text-gray-400 mb-4">
        Dashboard
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <p className="text-xs text-gray-400">
            Total Orders
          </p>
          <p className="text-lg font-semibold">
            {stats.total_orders}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <p className="text-xs text-gray-400">
            Revenue
          </p>
          <p className="text-lg font-semibold">
            ₹{Number(stats.total_revenue).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-6">
        <h2 className="text-sm font-semibold mb-3">
          Order Distribution
        </h2>

        <div className="w-full h-60">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={80}
                label
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
        <h2 className="text-sm font-semibold mb-3">
          Orders by Status
        </h2>

        <div className="w-full h-60">
          <ResponsiveContainer>
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Bar dataKey="orders">
                {barData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}