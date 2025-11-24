// client/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getEnv } from "@/helpers/getEnv";
import AddExpense from "@/components/AddExpense";

// ===============================
// FETCH BUDGET
// ===============================
async function fetchBudgetFromBackend(month, year) {
  try {
    const res = await fetch(
      `${getEnv("VITE_API_URL")}/budget/me?month=${month}&year=${year}`,
      { credentials: "include" }
    );

    const data = await res.json();
    if (!res.ok) return null;

    return data.budget;
  } catch (err) {
    console.error("Error fetching budget:", err);
    return null;
  }
}

const Dashboard = () => {
  const { user } = useSelector((state) => state.user);

  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // ===============================
  // FETCH CSV TRANSACTIONS
  // ===============================
  const fetchCsvTransactions = async () => {
    try {
      const res = await fetch(
        `${getEnv("VITE_API_URL")}/transactions/csv-data`,
        { credentials: "include" }
      );

      const json = await res.json();

      if (res.ok) {
        // Flatten: Each document has an array of transactions
        const flat = json.data.flatMap((doc) => doc.transactions);

        // Sort newest first
        flat.sort((a, b) => new Date(b.date) - new Date(a.date));

        setTransactions(flat);
      }
    } catch (error) {
      console.error("CSV Fetch Error:", error);
    }
  };

  // ===============================
  // useEffect → FETCH BUDGET + CSV
  // ===============================
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const fetchedBudget = await fetchBudgetFromBackend(month, year);

        if (!fetchedBudget) throw new Error("Failed to fetch budget");

        setBudget(fetchedBudget);

        // Fetch all CSV uploads
        await fetchCsvTransactions();
      } catch (e) {
        setErr(e.message);
        setBudget(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ===============================
  // LOADING / ERROR / NO BUDGET
  // ===============================
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-gray-300">
        Loading Dashboard...
      </div>
    );

  if (err)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-red-400 text-center">
        <p>{err}</p>
        <div className="mt-4">
          <Button onClick={() => (window.location.href = "/AccountSetup")}>
            Go to Account Setup
          </Button>
        </div>
      </div>
    );

  if (!budget)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-red-400 text-center">
        No budget found. Please set up your account.
      </div>
    );

  // ===============================
  // CHART + CATEGORY DATA
  // ===============================
  const COLORS = [
    "#4CAF50",
    "#FFC107",
    "#03A9F4",
    "#E91E63",
    "#9C27B0",
    "#FF5722",
    "#00BCD4",
    "#8BC34A",
  ];

  const categoryData = (budget.categories || []).map((cat) => ({
    name: cat.name,
    value:
      cat.type === "custom"
        ? cat.amount || 0
        : ((cat.pct || 0) / 100) * (budget.income || 0),
  }));

  const barData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(0, i).toLocaleString("default", { month: "short" });
    return {
      name: month,
      income: budget.income || 0,
      expenses: (budget.totals?.needs || 0) + (budget.totals?.wants || 0),
    };
  });

  const totalExpenses =
    (budget.totals?.needs || 0) + (budget.totals?.wants || 0);

  // ===============================
  // RETURN UI
  // ===============================
  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-[#3AAFA9]">
      <div className="px-4 sm:px-6 lg:px-8 py-8">

        {/* HEADER */}
        <div className="flex flex-wrap justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-white">
            Welcome, {user?.name || "User"}!
          </h1>

          {/* No nested button issue */}
          <AddExpense />
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <Card className="bg-[#1e293b] border border-[#334155] shadow-md">
            <CardContent className="p-5">
              <div className="text-sm text-gray-400">Total Income</div>
              <div className="text-2xl font-semibold mt-2 text-white">
                ₹{(budget.income || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b] border border-[#334155] shadow-md">
            <CardContent className="p-5">
              <div className="text-sm text-gray-400">Total Expenses</div>
              <div className="text-2xl font-semibold mt-2 text-red-400">
                ₹{totalExpenses.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b] border border-[#334155] shadow-md">
            <CardContent className="p-5">
              <div className="text-sm text-gray-400">Savings</div>
              <div className="text-2xl font-semibold mt-2 text-green-400">
                ₹{(budget.totals?.savings || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BAR CHART */}
        <Card className="bg-[#1e293b] border border-[#334155] shadow-md mb-10">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">
              Income vs Expenses (Jan–Dec)
            </h2>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PIE CHART */}
        <Card className="bg-[#1e293b] border border-[#334155] shadow-md mb-10">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">
              Spending by Categories
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-between gap-10 text-white">
              <div className="w-full md:w-1/2 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="md:w-1/2 w-full">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex justify-between items-center mb-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      ></span>
                      {cat.name}
                    </span>
                    <span>₹{cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RECENT TRANSACTIONS */}
        <Card className="bg-[#1e293b] border border-[#334155] shadow-md">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">
              Recent Transactions
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-400 border-b border-gray-600">
                  <tr>
                    <th className="py-2">Date</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-3 text-center text-gray-400">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, idx) => (
                      <tr key={tx._id || idx} className="border-b border-gray-700">
                        <td className="py-2 text-white">
                          {new Date(tx.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        <td className="py-2 text-white">
                          {tx.description || tx.category || "N/A"}
                        </td>

                        <td>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: COLORS[idx % COLORS.length] + "33",
                              color: COLORS[idx % COLORS.length],
                            }}
                          >
                            {tx.category || "Uncategorized"}
                          </span>
                        </td>

                        <td
                          className={`text-right ${
                            tx.type === "expense" ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          ₹{(tx.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
