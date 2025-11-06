import { handleError } from "../helpers/handleError.js";
import Budget from "../models/budget.model.js"

// ✅ Save a new budget (or update if same month/year exists)
export const saveBudget = async (req, res, next) => {
  try {
    const { income, rule, customSplits, totals, categories, title, period } = req.body;

    if (!period || !period.month || !period.year) {
      return next(handleError(400, "Month and year are required"));
    }

    // Check existing budget first
    let budget = await Budget.findOne({
      user: req.user._id,
      "period.month": period.month,
      "period.year": period.year,
    });

    const previousCategories = budget?.categories || [];

    // Upsert the budget
    budget = await Budget.findOneAndUpdate(
      { user: req.user._id, "period.month": period.month, "period.year": period.year },
      { income, rule, customSplits, totals, categories, title, period, user: req.user._id },
      { new: true, upsert: true }
    );

    // Determine newly added categories
    const newCategories = categories?.filter(cat => !previousCategories.includes(cat)) || [];

    res.json({ success: true, budget, newCategories });
  } catch (err) {
    return next(handleError(400, "Data not found"));
  }
};


// ✅ Get logged-in user's budget for a given month/year
export const getMyBudget = async (req, res , next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return next(handleError(400, "Month and year are required" ));
    }

    const budget = await Budget.findOne({
      user: req.user._id,
      "period.month": Number(month),
      "period.year": Number(year)
    });

    if (!budget) {
      return next(handleError(400, "Budget not found" ));
    }

    res.json({ success: true, budget });
  } catch (err) {
    return next(handleError(400,"Data not found"))
  }
};

// ✅ Get all budgets for logged-in user
export const getAllBudgets = async (req, res , next) => {
  try {
    const budgets = await Budget.find({ user: req.user._id }).sort({
      "period.year": -1,
      "period.month": -1
    });

    res.json({ success: true, budgets });
  } catch (err) {
    return next(handleError(400,"Budget not found"))
  }
};
