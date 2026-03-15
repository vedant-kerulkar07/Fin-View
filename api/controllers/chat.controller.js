import Budget from "../models/budget.model.js";
import CsvTransaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
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

    //  CHECK MEMORY (same question asked before)
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

    //  PREPARE CHAT HISTORY (last 10 messages)
    const historyMessages = chatDoc.messages
      .slice(-10)
      .flatMap((m) => [
        { role: "user", content: m.message },
        { role: "assistant", content: m.response },
      ]);

    let systemPrompt = "";
    let model = "llama-3.3-70b-versatile";

    if (isFinancial) {
      const user = await User.findById(userId).select("-password");

      const budgets = await Budget.find({ user: userId }).lean();

      const transactions = await CsvTransaction.find({
        uploadedBy: userId,
      }).lean();

      systemPrompt = `
You are Fin-View AI Assistant.

Respond professionally and concisely.
Use relevant emojis while answering.

Rules:
- Answer ONLY using the database provided.
- No casual language.
- Keep answers short and clear.
- If data is not found say: "No data available."

User:
${JSON.stringify(user)}

Budgets:
${JSON.stringify(budgets)}

Transactions:
${JSON.stringify(transactions)}
      `;
    } else {
      systemPrompt = `
You are Fin-View AI Assistant.

Respond professionally in one or two lines.
Keep answers short and precise.
No casual conversation.
      `;
    }

    //  CALL GROQ WITH MEMORY
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message },
      ],
      temperature: 0.2,
      max_tokens: 150,
    });

    const answer = completion.choices[0].message.content.trim();

    //  SAVE MESSAGE TO MEMORY
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

//  GET CHAT HISTORY
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