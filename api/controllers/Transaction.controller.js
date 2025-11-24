import csv from "csv-parser";
import fs from "fs";
import CsvTransaction from "../models/transaction.model.js";

export const uploadCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", async () => {
        const inserted = [];

        for (const row of results) {
          inserted.push(
            await CsvTransaction.create({
              date: new Date(row.date),
              category: row.category, // using category
              amount: Number(row.amount),

              // auto-detect income/expense:
              type: Number(row.amount) < 0 ? "expense" : "income",

              uploadedBy: req.user?._id || null,
            })
          );
        }

        fs.unlinkSync(req.file.path);

        return res.status(200).json({
          message: "CSV data uploaded & saved successfully",
          total: inserted.length,
        });
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCsvData = async (req, res) => {
  try {
    const data = await CsvTransaction.find().sort({ date: -1 });

    return res.status(200).json({
      message: "CSV data fetched successfully",
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
