import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Title,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, Title);

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  ChevronLeft,
  Wallet,
  Pencil,
  CheckCircle2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { getEnv } from "@/helpers/getEnv";
import { showToast } from "@/helpers/showToast";
import { data } from "autoprefixer";

// ===== Helper functions =====
const currency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);

const SECTION_BG = "bg-[#0f172a]";
const PANEL_BG = "bg-[#111827]";
const MUTED = "text-slate-300";

const DEFAULT_RULE = {
  key: "50-30-20",
  name: "50-30-20 Rule (Recommended)",
  splits: { needs: 50, wants: 30, savings: 20 },
};

const RULES = [
  DEFAULT_RULE,
  { key: "custom", name: "Custom Rule", splits: { needs: 0, wants: 0, savings: 0 } },
];

const DEFAULT_CATEGORIES = [
  { key: "rent", name: "Rent", pct: 30 },
  { key: "groceries", name: "Groceries", pct: 12 },
  { key: "utilities", name: "Utilities", pct: 6 },
  { key: "transport", name: "Transportation", pct: 2 },
  { key: "dining", name: "Dining Out", pct: 8 },
  { key: "entertainment", name: "Entertainment", pct: 6 },
  { key: "subscriptions", name: "Subscriptions", pct: 6 },
  { key: "health", name: "Healthcare", pct: 4 },
  { key: "investments", name: "Investments", pct: 6 },
];

// ===== API Helpers =====
async function getCurrentUser() {
  try {
    const res = await fetch(`${getEnv("VITE_API_URL")}/users/me`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch user");
    return data.user;
  } catch (err) {
    console.error(err);
    return null;
  }
}
async function saveBudgetToBackend(budget) {
  try {
    const res = await fetch(`${getEnv("VITE_API_URL")}/budget/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(budget),
    });
    const data = await res.json();
    if (!res.ok)
      return showToast("error", data.message || "Failed to apply leave");

    showToast("success", data.message || "Account Setup successfully");
    return data;
  } catch (err) {
    showToast("error", err.message || "Server error");
  }
}

async function fetchBudgetFromBackend(month, year) {
  try {
    const res = await fetch(`${getEnv("VITE_API_URL")}/budget/me?month=${month}&year=${year}`,
      { credentials: "include" });
    const data = await res.json();
    if (!res.ok) return null;
    return data.budget;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// ===== Main Component =====
export default function BudgetOnboardingSinglePage() {
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [rule, setRule] = useState(DEFAULT_RULE.key);
  const [customSplits, setCustomSplits] = useState({ needs: 0, wants: 0, savings: 0 });
  const [income, setIncome] = useState(50000);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [user, setUser] = useState(null);

  const [planName, setPlanName] = useState("");
  const [totalBudget, setTotalBudget] = useState(24000);
  const [customCategories, setCustomCategories] = useState([
    { id: Date.now(), name: "Rent", limit: 15000 },
    { id: Date.now() + 1, name: "Groceries", limit: 6000 },
    { id: Date.now() + 2, name: "Utilities", limit: 3000 },
  ]);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const today = new Date();
      const budget = await fetchBudgetFromBackend(today.getMonth() + 1, today.getFullYear());
      if (budget) {
        setIncome(budget.income);
        setRule(budget.rule || DEFAULT_RULE.key);
        setCustomSplits(budget.customSplits || { needs: 0, wants: 0, savings: 0 });
        setCategories(budget.categories?.length ? budget.categories : DEFAULT_CATEGORIES);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    }
    init();
  }, []);

  // auto-load default categories when selecting recommended rule
  useEffect(() => {
    if (rule === "50-30-20") {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, [rule]);

  const selectedRule = rule === "custom" ? { key: "custom", name: "Custom Rule", splits: customSplits } : DEFAULT_RULE;

  const totals = useMemo(() => {
    const needs = Math.round((selectedRule.splits.needs / 100) * income);
    const wants = Math.round((selectedRule.splits.wants / 100) * income);
    const savings = Math.round((selectedRule.splits.savings / 100) * income);
    return { needs, wants, savings, total: income };
  }, [income, selectedRule]);

  const chartData = useMemo(
    () => ({
      labels: ["Needs", "Wants", "Savings"],
      datasets: [
        {
          label: "Breakdown",
          data: [totals.needs, totals.wants, totals.savings],
          backgroundColor: ["#1e3a8a", "#7c3aed", "#10b981"],
          borderColor: ["#0b1229", "#0b1229", "#0b1229"],
          borderWidth: 4,
          hoverOffset: 8,
        },
      ],
    }),
    [totals]
  );

  const progressByStep = (s) => [0, 20, 40, 40, 70, 100][s] || 0;

  const setPct = (key, newPct) => {
    const pct = Math.max(0, Math.min(100, Number(newPct) || 0));
    setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, pct } : c)));
  };

  const categoriesPctSum = useMemo(() => categories.reduce((acc, c) => acc + (Number(c.pct) || 0), 0), [categories]);
  const remainingPct = 100 - categoriesPctSum;

  const customSum = useMemo(() => customCategories.reduce((s, c) => s + (Number(c.limit) || 0), 0), [customCategories]);
  const addCustomCategory = () => setCustomCategories((prev) => [...prev, { id: Date.now() + Math.random(), name: "", limit: 0 }]);
  const removeCustomCategory = (id) => setCustomCategories((prev) => prev.filter((c) => c.id !== id));
  const updateCustomCategory = (id, key, value) => setCustomCategories((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)));

  const ESSENTIAL_KEYWORDS = ["rent", "grocery", "grocer", "utilit", "health", "transport", "medicine", "loan"];

  const deriveSplitsFromCustom = (incomeVal, cats) => {
    const inc = Number(incomeVal) || 0;
    const needsSum = cats.filter(c => ESSENTIAL_KEYWORDS.some(k => c.name?.toLowerCase().includes(k))).reduce((s, c) => s + (Number(c.limit) || 0), 0);
    const wantsSum = cats.filter(c => !ESSENTIAL_KEYWORDS.some(k => c.name?.toLowerCase().includes(k))).reduce((s, c) => s + (Number(c.limit) || 0), 0);
    let needsPct = inc ? Math.round((needsSum / inc) * 100) : 0;
    let wantsPct = inc ? Math.round((wantsSum / inc) * 100) : 0;
    let savingsPct = Math.max(0, 100 - (needsPct + wantsPct));

    if (needsPct + wantsPct + savingsPct > 100) {
      const scale = 100 / (needsPct + wantsPct + savingsPct);
      needsPct = Math.round(needsPct * scale);
      wantsPct = Math.round(wantsPct * scale);
      savingsPct = 100 - (needsPct + wantsPct);
    }

    return { needs: needsPct, wants: wantsPct, savings: savingsPct };
  };

  const gotoNext = async () => {
    if (rule !== "custom") {
      if (activeStep === 1) return setActiveStep(2);
      if (activeStep === 2) {
        setCategories(DEFAULT_CATEGORIES);
        return setActiveStep(4);
      }
    } else {
      if (activeStep === 1) return setActiveStep(3);
      if (activeStep === 3) {
        const inc = Number(totalBudget) || 0;
        if (inc <= 0) return alert("Please enter a valid total budget.");
        if (!customCategories.length) return alert("Please add at least one category.");

        const newCats = customCategories.map((c, idx) => ({
          key: (c.name || `cat-${idx}`).toLowerCase().replace(/\s+/g, "-") + "-" + idx,
          name: c.name || `Category ${idx + 1}`,
          pct: Math.round(((Number(c.limit) || 0) / inc) * 100),
        }));

        setIncome(inc);
        setCategories([...DEFAULT_CATEGORIES, ...newCats]);
        setCustomSplits(deriveSplitsFromCustom(inc, customCategories));
        setRule("custom");
        return setActiveStep(4);
      }
    }

    if (activeStep === 4) {
      const today = new Date();

      // ✅ Calculate amount for each category before saving
      const categoriesWithAmount = categories.map((c) => ({
        ...c,
        amount: Math.round(((Number(c.pct) || 0) / 100) * Number(income || 0)),
      }));

      // ✅ Optional: calculate total
      const totalAmount = categoriesWithAmount.reduce((sum, c) => sum + c.amount, 0);

      const payload = {
        title: `${today.toLocaleString("default", { month: "long" })} ${today.getFullYear()} Budget`,
        income,
        rule,
        customSplits,
        totals: { ...totals, total: totalAmount },
        categories: categoriesWithAmount,
        period: { month: today.getMonth() + 1, year: today.getFullYear() },
      };

      await saveBudgetToBackend(payload);
      return setActiveStep(5);
    }
  }

  const gotoPrev = () => {
    if ([2, 3].includes(activeStep)) return setActiveStep(1);
    if (activeStep === 4) return setActiveStep(rule === "custom" ? 3 : 2);
    if (activeStep === 5) return setActiveStep(4);
    return setActiveStep((s) => Math.max(1, s - 1));
  };

  const StepHeader = ({ step, title }) => (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white" onClick={gotoPrev} disabled={activeStep === 1}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-green-400 text-xl font-semibold">{title}</h2>
      </div>
      <div className="mt-3">
        <Progress value={progressByStep(step)} className="h-2 bg-white" />
        <div className="mt-1 text-xs text-slate-400">{progressByStep(step)}%</div>
      </div>
    </div>
  );

  // ---------- JSX ----------
  return (
    <div className={`${SECTION_BG} min-h-screen w-full py-8 px-4 md:px-8`}>
      <div className="mx-auto max-w-6xl space-y-10">
        {/* STEP 1 */}
        {activeStep === 1 && (
          <section>
            <StepHeader step={1} title="Let’s set up your account" />
            <Card className={`${PANEL_BG} border-slate-400`}>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="col-span-1 flex items-center justify-center">
                  <div className="h-28 w-full rounded-xl bg-slate-800/60 flex items-center justify-center">
                    <Wallet className="h-12 w-20 text-slate-300" />
                  </div>
                </div>
                <div className="col-span-2 space-y-4">
                  <div>
                    <h3 className="text-white text-lg font-semibold">{user?.name || "Loading..."}</h3>
                    <p className="text-sm text-slate-300">Select your rule to categorize your spends</p>
                  </div>
                  <Select value={rule} onValueChange={setRule}>
                    <SelectTrigger className="w-[320px] bg-slate-900 text-white border-slate-800">
                      <SelectValue placeholder="Select a rule" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-white border-slate-700">
                      {RULES.map(r => <SelectItem key={r.key} value={r.key}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={gotoNext} className="mt-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold">Next</Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* -------- STEP 2 (DEFAULT) -------- */}
        {activeStep === 2 && (
          <section id="step2">
            <StepHeader step={2} title="Income & High-level Allocations" />
            <Card className={`${PANEL_BG} border-slate-400`}>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label htmlFor="income" className={`${MUTED}`}>
                    Enter Your Monthly Income (₹)
                  </Label>
                  <Input
                    id="income"
                    type="number"
                    inputMode="numeric"
                    value={income}
                    onChange={(e) => {
                      const val = parseInt(e.target.value || "0", 10);
                      setIncome(Number.isFinite(val) && val >= 0 ? val : 0);
                    }}
                    placeholder="E.g. 40,000"
                    className="mt-2 bg-slate-900 text-slate-100 border-slate-800 placeholder:text-slate-500 "
                  />
                </div>

                <div className="justify-between">
                  {["needs", "wants", "savings"].map((key) => (
                    <Card key={key} className="bg-slate-800/60 border-slate-700 gap-3 mb-4">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-slate-300 capitalize">
                              {key} - {selectedRule.splits[key]}%
                            </p>
                            <p className="mt-1 text-lg font-semibold text-slate-100">
                              {currency(Math.round((selectedRule.splits[key] / 100) * income))}
                            </p>
                          </div>
                          <Button size="icon" variant="ghost" className="text-slate-400 hover:text-slate-100">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={gotoPrev} className="border-slate-700 text-white-200 hover:bg-red-800">
                    Back
                  </Button>
                  <Button onClick={gotoNext} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold">
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* -------- STEP 3 (CUSTOM PLAN UI) -------- */}
        {activeStep === 3 && (
          <section id="step3">
            <StepHeader step={3} title="Create Your Custom Plan" />
            <Card className={`${PANEL_BG} border-slate-400`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className={`${MUTED}`}>Plan Name</Label>
                        <Input
                          placeholder="E.g My Budget"
                          value={planName}
                          onChange={(e) => setPlanName(e.target.value)}
                          className="mt-2 bg-slate-900 text-slate-100 border-slate-800"
                        />
                      </div>
                      <div>
                        <Label className={`${MUTED}`}>Total Budget</Label>
                        <Input
                          type="number"
                          placeholder="24000"
                          value={totalBudget}
                          onChange={(e) => setTotalBudget(Number(e.target.value || 0))}
                          className="mt-2 bg-slate-900 text-slate-100 border-slate-800"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label className={`${MUTED}`}>Add Expense Categories</Label>
                      <div className="space-y-3 mt-3">
                        {customCategories.map((c) => (
                          <div key={c.id} className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-7">
                              <Input
                                placeholder="Category"
                                value={c.name}
                                onChange={(e) => updateCustomCategory(c.id, "name", e.target.value)}
                                className="bg-slate-900 text-slate-100 border-slate-800"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                type="number"
                                placeholder="9999"
                                value={c.limit}
                                onChange={(e) => updateCustomCategory(c.id, "limit", Number(e.target.value || 0))}
                                className="bg-slate-900 text-slate-100 border-slate-800"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <Button variant="ghost" onClick={() => removeCustomCategory(c.id)} className="h-9 w-9 text-slate-400">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <Button onClick={addCustomCategory} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100">
                          Add Category
                        </Button>
                      </div>

                      <div className="mt-4 text-sm text-slate-300">
                        <div>Allocated total: <span className="font-semibold text-slate-100">{currency(customSum)}</span></div>
                        <div className={`mt-1 ${customSum > totalBudget ? "text-rose-400" : "text-amber-300"}`}>
                          {Math.round(totalBudget ? (customSum / totalBudget) * 100 : 0)}% of total budget allocated
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* right column preview */}
                  <div className="lg:col-span-1">
                    <Card className="bg-slate-900/40 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-slate-100">Preview</CardTitle>
                        <CardDescription className={`${MUTED}`}>Plan & category allocation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-slate-300 mb-3">
                          <div>Plan: <span className="text-slate-100 font-medium">{planName || "Custom Plan"}</span></div>
                          <div className="mt-2">Total: <span className="text-slate-100 font-medium">{currency(totalBudget)}</span></div>
                        </div>
                        <div className="space-y-2">
                          {customCategories.map((c, idx) => (
                            <div key={c.id} className="flex justify-between items-center text-sm">
                              <div className="text-slate-300">{c.name || `Category ${idx + 1}`}</div>
                              <div className="text-slate-100">{currency(Number(c.limit) || 0)}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={gotoPrev} className="border-slate-700 text-white-200 hover:bg-red-800">
                    Back
                  </Button>

                  <Button
                    onClick={gotoNext}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* -------- STEP 4 (Overview - shared) -------- */}
        {activeStep === 4 && (
          <section id="step4">
            <StepHeader step={4} title="Your Budget Overview" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={`${PANEL_BG} border-slate-800`}>
                <CardHeader>
                  <CardTitle className="text-slate-100">{selectedRule.name} Breakdown</CardTitle>
                  <CardDescription className={`${MUTED}`}>{currency(income)} Total Budget</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="w-full max-w-md mx-auto">
                    <Doughnut
                      data={chartData}
                      options={{
                        plugins: { legend: { display: false } },
                        cutout: "70%",
                        responsive: true,
                        maintainAspectRatio: true,
                      }}
                    />
                    <div className="mt-6 grid grid-cols-3 text-center text-sm text-slate-300">
                      <div>
                        <div className="h-3 w-3 rounded-full inline-block mr-2" style={{ background: "#1e3a8a" }} />
                        Needs ({selectedRule.splits.needs}%)
                        <div className="mt-1 font-semibold text-slate-100">{currency(totals.needs)}</div>
                      </div>
                      <div>
                        <div className="h-3 w-3 rounded-full inline-block mr-2" style={{ background: "#7c3aed" }} />
                        Wants ({selectedRule.splits.wants}%)
                        <div className="mt-1 font-semibold text-slate-100">{currency(totals.wants)}</div>
                      </div>
                      <div>
                        <div className="h-3 w-3 rounded-full inline-block mr-2" style={{ background: "#10b981" }} />
                        Savings ({selectedRule.splits.savings}%)
                        <div className="mt-1 font-semibold text-slate-100">{currency(totals.savings)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`${PANEL_BG} border-slate-800`}>
                <CardHeader>
                  <CardTitle className="text-slate-100">Your Budget Overview</CardTitle>
                  <CardDescription className={`${MUTED}`}>Distribute your expenses across categories</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-4 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Categories Sum</span>
                      <span className={`font-semibold ${remainingPct === 0 ? "text-emerald-400" : remainingPct < 0 ? "text-rose-400" : "text-amber-300"}`}>
                        {categoriesPctSum}% (Remaining: {remainingPct}%)
                      </span>
                    </div>
                    <Separator className="my-3 bg-slate-800" />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-slate-400">Category</TableHead>
                        <TableHead className="text-slate-400">% Allocation</TableHead>
                        <TableHead className="text-right text-slate-400">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((c) => (
                        <TableRow key={c.key} className="border-slate-800">
                          <TableCell className="text-slate-200">{c.name}</TableCell>
                          <TableCell className="text-slate-300">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-slate-700 text-slate-300">
                                {c.pct}%
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-slate-300 border-slate-300">
                                  {[0, 2, 4, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50].map((p) => (
                                    <DropdownMenuItem key={p} onClick={() => setPct(c.key, p)}>
                                      {p}%
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-slate-200">
                            {currency(Math.round(((Number(c.pct) || 0) / 100) * income))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline" onClick={gotoPrev} className="border-slate-700 text-white-200 hover:bg-red-800">
                    Back
                  </Button>
                  <Button onClick={gotoNext} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold">
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>
        )}

        {/* -------- STEP 5 (Finish) -------- */}
        {activeStep === 5 && (
          <section id="step5">
            <StepHeader step={5} title="All Set!" />
            <Card className={`${PANEL_BG} border-slate-800 overflow-hidden`}>
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="rounded-xl bg-slate-800/60 h-36 flex flex-col items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                    <p className="mt-3 text-slate-100 font-medium">You have successfully set up your account…</p>
                    <p className="text-slate-400 text-sm">
                      Income: <span className="text-slate-200 font-medium">{currency(income)}</span> • Rule:{" "}
                      <span className="text-slate-200 font-medium">{selectedRule.name}</span>
                    </p>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={() => setActiveStep(1)} className="border-slate-700 text-white-200 hover:bg-red-800">
                      Restart
                    </Button>
                    <Button className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold" onClick={() => navigate("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
