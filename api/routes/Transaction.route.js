import express from "express";
import { upload } from "../middleware/uploadCsv.js";
import { deleteCsv, getCsvData, uploadCsv } from "../controllers/Transaction.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const csvRoute = express.Router();

csvRoute.post("/upload-csv",authenticate , upload.single("file"), uploadCsv);
csvRoute.get("/csv-data", authenticate, getCsvData);
csvRoute.delete("/delete-csv/:transactionId", authenticate, deleteCsv)

export default csvRoute;
