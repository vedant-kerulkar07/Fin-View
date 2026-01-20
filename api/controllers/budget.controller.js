import { handleError } from "../helpers/handleError.js";
import Budget from "../models/budget.model.js"

//  Save a new budget (or update if same month/year exists)
export const saveBudget = async (req, res, next) => {
  try {
    const { income, customSplits, totals, categories, title, period } = req.body;

    if (!period?.month || !period?.year) {
      return next(handleError(400, "Month and year are required"));
    }

    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user._id,
        "period.month": period.month,
        "period.year": period.year,
      },
      {
        $set: {
          income,
          customSplits,
          totals,
          categories,
          title,
          period,
          user: req.user._id,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Budget saved successfully",
      budget,
    });
  } catch (err) {
    next(err); // no 11000 expected anymore
  }
};

//  Add expense to a category
export const addExpense = async (req, res, next) => {
  try {
    const { category, amount, date, title } = req.body;

    if (!category || !amount || !date) {
      return next(handleError(400, "Category, amount, and date are required"));
    }

    // Ensure user has a budget
    let budget = await Budget.findOne({ user: req.user._id });

    if (!budget) {
      budget = await Budget.create({
        user: req.user._id,
        income: 0,
        totals: { needs: 0, wants: 0, savings: 0 }
      });
    }

    // Normalize category input
    const normalized = category.trim().toLowerCase();

    // Check if category exists
    let cat = budget.categories.find(
      (c) => c.name.toLowerCase() === normalized
    );

    // If not exists → CREATE NEW CATEGORY
    if (!cat) {
      const newCategory = {
        key: normalized.replace(/\s+/g, "-"),
        name: category,
        pct: 0,
        amount: 0,
        type: "custom",
        expenses: [],
      };

      budget.categories.push(newCategory);
      cat = budget.categories[budget.categories.length - 1];
    }

    // Add expense
    cat.expenses.push({
      title: title || "Expense",
      amount,
      date,
    });

    // Update category total
    cat.amount += Number(amount);

    // Update totals (only if category is needs/wants/savings)
    const key = cat.key.toLowerCase();

    if (key === "needs") budget.totals.needs += Number(amount);
    else if (key === "wants") budget.totals.wants += Number(amount);
    else if (key === "savings") budget.totals.savings += Number(amount);

    budget.totals.total =
      budget.totals.needs + budget.totals.wants + budget.totals.savings;

    await budget.save();

    res.json({
      success: true,
      message: "Expense added successfully",
      budget,
    });
  } catch (err) {
    next(err);
  }
};

// Get logged-in user's budget for a given month/year
export const getMyBudget = async (req, res, next) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year) {
      return next(handleError(400, "Valid month and year are required"));
    }

    const budget = await Budget.findOne({
      user: req.user._id,
      "period.month": month,
      "period.year": year,
    }).lean();

    //  Correct: return null instead of error
    return res.status(200).json({
      success: true,
      budget: budget || null,
    });

  } catch (err) {
    next(err);
  }
};



//  Get all budgets for logged-in user
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