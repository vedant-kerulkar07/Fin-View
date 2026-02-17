import Budget from "../models/budget.model.js";
import CsvTransaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import Location from "../models/location.model.js";
import Chat from "../models/chatHistory.model.js";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Normalize question for memory matching
const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const financialKeywords = [
  "budget",
  "income",
  "expense",
  "spent",
  "transaction",
  "rent",
  "saving",
  "money",
  "investment",
  "balance",
  "category",
];

export const simpleChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    const normalizedMsg = normalize(message);
    const isFinancial = financialKeywords.some((k) =>
      normalizedMsg.includes(k)
    );

    let chatDoc = await Chat.findOne({ user: userId });
    if (!chatDoc) {
      chatDoc = new Chat({ user: userId, messages: [] });
    }

    const existing = chatDoc.messages.find(
      (m) => m.normalizedMessage === normalizedMsg
    );

    if (existing) {
      return res.json({
        success: true,
        answer: existing.response,
        fromMemory: true,
      });
    }

    let systemPrompt = "";
    let model = "llama-3.3-70b-versatile";

    if (isFinancial) {
      const user = await User.findById(userId).select("-password");
      const budgets = await Budget.find({ user: userId }).lean();
      const transactions = await CsvTransaction.find({
        uploadedBy: userId,
      }).lean();

      systemPrompt = `
You are Fine-View AI Assistant.
Respond professionally and concisely.
Answer ONLY using the database provided.
and used relevant emojis while answering the questions
Rules:
- No casual language
- No long explanations
- If data not found, say: "No data available."
-If data is not available generate a data at your own generate a new answere

User:
${JSON.stringify(user)}

Budgets:
${JSON.stringify(budgets)}

Transactions:
${JSON.stringify(transactions)}
      `;

      model = "llama-3.3-70b-versatile";
    } else {
      systemPrompt = `
You are Fine-View AI Assistant.
Respond professionally in one or two lines.
No casual conversation.
      `;
    }

    // 🔥 STEP 3: CALL GROQ
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.2, // professional, consistent
      max_tokens: 150,
    });

    const answer = completion.choices[0].message.content.trim();

    // 🔥 STEP 4: SAVE TO MEMORY
    chatDoc.messages.push({
      message,
      normalizedMessage: normalizedMsg,
      response: answer,
      isFinancial,
    });

    await chatDoc.save();

    res.json({
      success: true,
      answer,
      fromMemory: false,
    });
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const chatDoc = await Chat.findOne({ user: userId }).lean();

    res.json({
      success: true,
      chats: chatDoc ? chatDoc.messages : [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
