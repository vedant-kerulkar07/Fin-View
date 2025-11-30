import Budget from "../models/budget.model.js";
import CsvTransaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Location from "../models/location.model.js";
import Chat from "../models/chatHistory.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const financialKeywords = [
  "budget",
  "income",
  "expenses",
  "spent",
  "transactions",
  "savings",
  "money",
  "investments",
  "balance",
  "category",
  "allocation"
];

const greetingWords = ["hi", "hello", "hey", "hii", "good morning", "good evening"];

// --- Save or respond to chat ---
export const simpleChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;
    const lowerMsg = message.toLowerCase();

    const isGreeting = greetingWords.some(word => lowerMsg.startsWith(word));
    const isFinancialQuestion = financialKeywords.some(word => lowerMsg.includes(word));

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });

    let chatDoc = await Chat.findOne({ user: userId });
    if (!chatDoc) chatDoc = new Chat({ user: userId, messages: [] });

    const memoryText = chatDoc.messages
      .slice(-100)
      .map(m => `User: ${m.message}\nBot: ${m.response}`)
      .join("\n");

    let answer = "";

    if (isGreeting || !isFinancialQuestion) {
      // General conversation with memory
      const result = await model.generateContent(
        `You are a friendly chatbot. Remember the previous conversation:\n${memoryText}\n` +
        `User said: "${message}". Reply naturally and conversationally. Do NOT include database info.`
      );
      answer = result.response.text();
    } else {
      // Financial question: include DB context + memory
      const user = await User.findById(userId).select("-password");
      const budgets = await Budget.find({ user: userId }).lean();
      const transactions = await CsvTransaction.find({ uploadedBy: userId }).lean();
      const location = await Location.find().lean();

      const context = `User Info:
${JSON.stringify(user, null, 2)}

Budgets:
${JSON.stringify(budgets, null, 2)}

Transactions:
${JSON.stringify(transactions, null, 2)}

Location Data:
${JSON.stringify(location, null, 2)}
`;

      const result = await model.generateContent([
        {
          text:
            "You are a financial assistant. Answer the user's questions ONLY using the transactions and budgets provided. " +
            "Remember the previous conversation:\n" + memoryText + "\n\n" +
            "Follow these rules:\n" +
            "- If the user asks about transactions, provide only transaction name and amount.\n" +
            "- Filter transactions by date, month, or category if mentioned in the user's question.\n" +
            "- Do NOT include greetings or unrelated commentary.\n" +
            "- Do NOT use JSON or code blocks, only natural conversational text.\n\n" +
            "Here is the user's database context:\n" +
            context
        },
        { text: message }
      ]);

      answer = result.response.text();
    }

    // --- Save chat in DB ---
    chatDoc.messages.push({
      message,
      response: answer,
      isFinancial: isFinancialQuestion
    });
    await chatDoc.save();

    res.json({ success: true, answer });

  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const chatDoc = await Chat.findOne({ user: userId }).lean();

    if (!chatDoc) {
      return res.json({ success: true, chats: [] });
    }

    res.json({ success: true, chats: chatDoc.messages });
  } catch (error) {
    console.error("Get Chat History Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
