import mongoose from "mongoose";

// ===== Expense Subschema =====
const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Expense" },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
  },
  { _id: false }
);

// ===== Category Subschema =====
const categorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    pct: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["default", "custom"],
      default: "default",
    },
    expenses: {
      type: [expenseSchema],
      default: [],
    },
  },
  { _id: false }
);

// ===== Budget Schema =====
const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    income: {
      type: Number,
      default: 0,
    },

    customSplits: {
      type: Map,
      of: Number,
      default: {},
    },

    totals: {
      needs: { type: Number, default: 0 },
      wants: { type: Number, default: 0 },
      savings: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },

    categories: {
      type: [categorySchema],
      default: [
        { key: "needs", name: "Needs", pct: 50 },
        { key: "wants", name: "Wants", pct: 30 },
        { key: "savings", name: "Savings", pct: 20 },
      ],
    },

    title: {
      type: String,
      default: "My Budget",
    },

    period: {
      month: { type: Number, min: 1, max: 12, required: true },
      year: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

//  COMPOUND UNIQUE INDEX (CRITICAL)
budgetSchema.index(
  { user: 1, "period.month": 1, "period.year": 1 },
  { unique: true }
);

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
