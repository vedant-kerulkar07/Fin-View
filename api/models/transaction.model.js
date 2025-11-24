import mongoose from "mongoose";

const singleTransactionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
});

const csvTransactionSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,            // 🔥 faster user-wise queries
    },

    title: {
      type: String,
      default: "CSV Uploaded Transactions",
    },

    transactions: {
      type: [singleTransactionSchema], // ARRAY OF ALL ROWS
      default: [],
      required: true,
    },
  },
  { timestamps: true }
);

// 🔥 Create index so fetch by user is fast
csvTransactionSchema.index({ uploadedBy: 1, createdAt: -1 });

const CsvTransaction = mongoose.model("CsvTransaction", csvTransactionSchema);
export default CsvTransaction;
