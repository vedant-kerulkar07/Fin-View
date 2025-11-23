import express from "express";
import { saveBudget, getMyBudget, getAllBudgets, addExpense, } from "../controllers/budget.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const budgetRoutes = express.Router();

budgetRoutes.post("/save", authenticate, saveBudget);
budgetRoutes.get("/me", authenticate, getMyBudget);
budgetRoutes.get("/all", authenticate, getAllBudgets);
budgetRoutes.post("/add-expense", authenticate, addExpense); // Temporary route for testing

export default budgetRoutes;
