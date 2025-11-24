import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv") cb(null, true);
  else cb(new Error("Only CSV files allowed"), false);
};

export const upload = multer({ storage, fileFilter });
