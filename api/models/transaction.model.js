import mongoose from "mongoose";

const csvTransactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    title: {
      type: String,
      default: function () {
        return `${this.category} Transaction`;
      },
    },

    category: {
      type: String,
      required: true,     // REQUIRED NOW
    },

    amount: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const CsvTransaction = mongoose.model("CsvTransaction", csvTransactionSchema);
export default CsvTransaction;
