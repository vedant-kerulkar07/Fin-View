import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { getEnv } from "@/helpers/getEnv";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#84CC16",
];

// Fetch Budget Data
async function fetchBudgetFromBackend(month, year) {
  try {
    const res = await fetch(`${getEnv("VITE_API_URL")}/budget/me?month=${month}&year=${year}`,
      { credentials: "include" }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to fetch budget");
    return data.budget;
  } catch (err) {
    console.error("Error fetching budget:", err);
    return null;
  }
}

const Analytics = () => {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBudget = async () => {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      setLoading(true);
      const fetchedBudget = await fetchBudgetFromBackend(month, year);
      if (!fetchedBudget) setErr("No budget found for this month.");
      setBudget(fetchedBudget);
      setLoading(false);
    };
    loadBudget();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Loading Analytics...
      </div>
    );

  if (err)
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-400 text-center">
        <p>{err}</p>
        <div className="mt-4">
          <Button onClick={() => (window.location.href = "/AccountSetup")}>
            Go to Account Setup
          </Button>
        </div>
      </div>
    );

  const { income, totals, categories } = budget || {};
  const totalExpenses =
    totals?.totalExpenses ||
    (totals?.needs || 0) + (totals?.wants || 0) + (totals?.custom || 0);
  const savings = income - totalExpenses;

  const categoryData =
    categories?.map((cat) => ({
      name: cat.name,
      planned: cat.planned || 0,
      actual: cat.actual || 0,
      value: cat.amount || ((cat.pct || 0) / 100) * (budget.income || 0) || 0,
    })) || [];

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(0, i).toLocaleString("default", { month: "short" }),
    spend: Math.floor(Math.random() * 40000) + 10000,
  }));

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 sm:p-6 overflow-hidden">
      <h2 className="text-2xl font-semibold mb-4">Analytics</h2>

      {/* ==== Top Summary Cards ==== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#1E293B] border-none">
          <CardContent className="p-4">
            <p className="text-gray-400 text-sm">Monthly Income</p>
            <h3 className="text-2xl font-semibold mt-2 text-white">
              ₹{income?.toLocaleString()}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-none">
          <CardContent className="p-4">
            <p className="text-gray-400 text-sm">Fixed Expenses</p>
            <h3 className="text-2xl font-semibold mt-2 text-red-400">
              ₹{totalExpenses?.toLocaleString()}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-none">
          <CardContent className="p-4">
            <p className="text-gray-400 text-sm">Savings</p>
            <h3 className="text-2xl font-semibold mt-2 text-green-400">
              ₹{savings?.toLocaleString()}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* ==== Monthly Expenditure (Side Scroll) ==== */}
      <h3 className="text-lg font-medium mb-3">Monthly Expenditure</h3>
      <div
        className="overflow-x-auto pb-3"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#000000 #000000",
        }}
      >
        <style>
          {`
            .overflow-x-auto::-webkit-scrollbar { height: 6px; }
            .overflow-x-auto::-webkit-scrollbar-track { background: #000000; }
            .overflow-x-auto::-webkit-scrollbar-thumb { background-color: #000000; border-radius: 10px; }
          `}
        </style>

        <div className="flex gap-4 min-w-max pb-2">
          {categoryData.map((cat, idx) => {
            const percentUsed = Math.min((cat.value / income) * 100 || 0, 100); // progress vs total income
            const leftAmount = cat.value; // directly show actual amount
            const leftText = `₹${cat.value?.toLocaleString()}`; // display actual amount

            return (
              <Card
                key={idx}
                className="bg-[#1E293B] border-none w-64 flex-shrink-0 hover:scale-[1.02] transition-transform"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between flex-wrap items-center">
                    <p className="font-semibold text-white">{cat.name}</p>
                    <p className="text-green-400 text-sm sm:text-base">{leftText}</p>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Planned: ₹{cat.value?.toLocaleString()} | Actual: ₹{cat.income?.toLocaleString()}
                  </p>

                  {/* Progress Bar */}
                  <div className="relative w-full h-2 bg-gray-700 rounded-full mt-3">
                    <div
                      className="absolute top-0 left-0 h-2 rounded-full bg-green-500"
                      style={{ width: `${percentUsed}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>₹0</span>
                    <span>₹{income?.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ==== Category-wise Spends (Donut Chart with Total Budget in Center) ==== */}
      <div className="bg-[#1E293B] rounded-2xl p-5 my-6">
        <h3 className="text-lg font-medium mb-3">Category-wise Spends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative h-64 flex justify-center items-center">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Total Budget */}
            <div className="absolute text-center">
              <p className="text-gray-400 text-sm">Total Budget</p>
              <p className="text-white text-xl font-bold">₹{income?.toLocaleString()}</p>
            </div>
          </div>

          <div>
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex justify-between py-1 border-b border-gray-700 text-sm">
                <span>{cat.name}</span>
                <span>₹{cat.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==== Monthly Spends Chart ==== */}
      <div className="bg-[#1E293B] rounded-2xl p-5">
        <h3 className="text-lg font-medium mb-3">Monthly Spends</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#CBD5E1" />
            <YAxis stroke="#CBD5E1" />
            <Tooltip />
            <Line type="monotone" dataKey="spend" stroke="#3B82F6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* <div className="flex justify-end mt-6">
        <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] px-8 py-2 text-white"
          onClick={()=>navigate("/dashboard/smartforecasting")}>
          Next
        </Button>
      </div> */}
    </div>
  );
};

export default Analytics;
