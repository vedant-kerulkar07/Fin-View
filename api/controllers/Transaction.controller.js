import csv from "csv-parser";
import fs from "fs";
import CsvTransaction from "../models/transaction.model.js";

export const uploadCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const rows = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        try {
          // Build validated rows
          const transactions = rows
            .map((row) => {
              if (!row.date || !row.category || !row.amount) return null;

              const parsedDate = new Date(row.date);
              if (isNaN(parsedDate)) return null;

              return {
                date: parsedDate,
                category: row.category.trim(),
                amount: Number(row.amount),
                type: Number(row.amount) < 0 ? "expense" : "income",
              };
            })
            .filter(Boolean); // remove invalid rows

          if (transactions.length === 0) {
            return res.status(400).json({
              message: "CSV has no valid rows.",
            });
          }

          // Create single document for this upload
          await CsvTransaction.create({
            uploadedBy: req.user._id,
            transactions,
          });

          fs.unlinkSync(req.file.path);

          return res.status(200).json({
            message: "CSV uploaded successfully",
            totalRows: transactions.length,
          });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: "Failed to save CSV" });
        }
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getCsvData = async (req, res) => {
  try {
    const data = await CsvTransaction.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "CSV data fetched successfully",
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
