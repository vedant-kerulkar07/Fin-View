import Budget from "../models/budget.model.js";
import CsvTransaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import Chat from "../models/chatHistory.model.js";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Normalize question
const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Financial detection keywords
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
  "salary",
  "finance",
  "payment",
  "debt",
  "loan",
];

// Smart memory match
const findSimilarQuestion = (messages, normalizedMsg) => {
  return messages.find(
    (m) =>
      normalizedMsg.includes(m.normalizedMessage) ||
      m.normalizedMessage.includes(normalizedMsg)
  );
};

export const simpleChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message required",
      });
    }

    const userId = req.user._id;

    const normalizedMsg = normalize(message);

    const isFinancial = financialKeywords.some((k) =>
      normalizedMsg.includes(k)
    );

    let chatDoc = await Chat.findOne({ user: userId });

    if (!chatDoc) {
      chatDoc = new Chat({
        user: userId,
        messages: [],
      });
    }

    // SMART MEMORY CHECK
    const existing = findSimilarQuestion(
      chatDoc.messages,
      normalizedMsg
    );

    if (existing) {
      return res.json({
        success: true,
        answer: existing.response,
        fromMemory: true,
      });
    }

    // Last 12 messages context
    const historyMessages = chatDoc.messages
      .slice(-12)
      .flatMap((m) => [
        {
          role: "user",
          content: m.message,
        },
        {
          role: "assistant",
          content: m.response,
        },
      ]);

    let systemPrompt = "";

    const model = "llama-3.3-70b-versatile";

    if (isFinancial) {
      const user = await User.findById(userId)
        .select("-password")
        .lean();

      const budgets = await Budget.find({
        user: userId,
      }).lean();

      const transactions =
        await CsvTransaction.find({
          uploadedBy: userId,
        }).lean();

      systemPrompt = `

You are Fin-View AI Assistant.
A professional fintech financial analysis assistant.

PRIMARY GOAL:
Give useful financial insights from database data.

COMMUNICATION STYLE:

- Professional
- Clear
- Structured
- Practical
- Insight driven

EMOJI RULES:

You MUST include 2–5 relevant emojis.

Use mainly:
📊 analysis
💰 money
📉 expenses
📈 income
⚠️ risk
✅ good
💡 advice

Never respond with zero emojis.

RESPONSE LENGTH:

Simple question:
3–5 lines

Analysis:
Structured medium answer

Advice:
Bullet points

Never:
• One line answers
• Huge paragraphs

FORMATTING:

Use sections like:

📊 Financial Summary

💰 Income: ₹X
📉 Expenses: ₹X
💵 Savings: ₹X

Use bullets for breakdowns.

IDENTITY RULES:

If user asks:
- their name
- profile info

Use User data.

DATABASE RULES:

Use ONLY provided data.

Never guess numbers.

If missing:
"No data available."

CONVERSATION RULES:

If follow up question appears,
use conversation history.

If question unclear,
answer based on context.

USER DATA:

${JSON.stringify(user)}

BUDGET DATA:

${JSON.stringify(budgets)}

TRANSACTION DATA:

${JSON.stringify(transactions)}

`;
    } else {
      const user = await User.findById(userId)
        .select("-password")
        .lean();

      systemPrompt = `

You are Fin-View AI Assistant.

Professional fintech assistant.

RULES:

Respond based on complexity.

Simple:
3 lines.

Complex:
Structured answer.

Never:
One line answers.

Use 1–2 emojis when helpful.

If user asks identity:

User data:

${JSON.stringify(user)}

Answer from it.

Be clear and helpful.

`;
    }

    // AI CALL
    const completion =
      await groq.chat.completions.create({
        model: model,

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },

          ...historyMessages,

          {
            role: "user",
            content: message,
          },
        ],

        temperature: 0.3,

        max_tokens: 400,

        presence_penalty: 0.2,

        frequency_penalty: 0.1,
      });

    const answer =
      completion.choices[0].message.content.trim();

    // SAVE MEMORY
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

// GET CHAT HISTORY

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const chatDoc = await Chat.findOne({
      user: userId,
    }).lean();

    res.json({
      success: true,
      chats: chatDoc
        ? chatDoc.messages
        : [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};