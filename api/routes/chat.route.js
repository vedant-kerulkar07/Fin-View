import express from "express";
import { simpleChat } from "../controllers/chat.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/ask",authenticate, simpleChat);

export default router;
