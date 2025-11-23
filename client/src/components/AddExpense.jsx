import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getEnv } from "@/helpers/getEnv";
import { showToast } from "@/helpers/showToast";

// ------------------------------
// 🎯 VALIDATION
// ------------------------------
const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => Number(v) > 0, "Amount must be greater than 0"),
  date: z.date(),
});

// ------------------------------
// 🔵 API CALL
// ------------------------------
async function addExpenseToBackend(categoryName, amount, date) {
  const res = await fetch(`${getEnv("VITE_API_URL")}/budget/add-expense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      category: categoryName,
      amount: Number(amount),
      date,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add expense");

  showToast("success", "Expense added successfully");
  return data;
}

// ------------------------------
// 🟩 COMPONENT
// ------------------------------
export default function AddExpense({ onSuccess }) {
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      amount: "",
      date: new Date(),
    },
  });

  const { register, handleSubmit, setValue, watch, formState } = form;
  const { errors } = formState;

  const selectedDate = watch("date");

  // ------------------------------
  // 💾 Save Expense
  // ------------------------------
  const handleSave = async (values) => {
    try {
      await addExpenseToBackend(values.category, values.amount, values.date);

      if (onSuccess) onSuccess();

      setOpen(false);
      form.reset({
        category: "",
        amount: "",
        date: new Date(),
      });
    } catch (err) {
      showToast("error", err.message || "Error saving expense");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#3AAFA9] hover:bg-[#2f9e95] text-black">
          + Add Expense
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-4 py-4">
          
          {/* Category */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Category Name</label>
            <Input
              type="text"
              placeholder="e.g. Food, Travel"
              {...register("category")}
            />
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="Enter amount"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setValue("date", date)}
                />
              </PopoverContent>
            </Popover>

            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full">
              Save Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
