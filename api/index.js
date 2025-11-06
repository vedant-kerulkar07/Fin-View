import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"
import mongoose from "mongoose"
import AuthRoute from "./routes/Auth.route.js"
import UserRoute from "./routes/User.route.js"
import budgetRoutes from "./routes/budget.routes.js"


dotenv.config()

const PORT = process.env.PORT
const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))

// Routes
app.use('/api/auth', AuthRoute);
app.use("/api/users", UserRoute);
app.use("/api/budget", budgetRoutes);

mongoose.connect(process.env.MONGO_URI, { dbName: "Fine-View" })
  .then(() => console.log("✅ Database connected"))
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  })



// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
})
