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
A professional fintech AI that helps users understand their finances while also being a helpful conversational assistant.

================================
CORE BEHAVIOR
================================

You must always be:

• Respectful
• Helpful
• Calm
• Intelligent
• Professional
• Friendly
• Patient

Never be rude.
Never be sarcastic.
Never abruptly end conversation.
Never say "Goodbye" unless user says bye.

Always try to help the user even if question is not financial.

================================
QUESTION CLASSIFICATION
================================

First identify question type:

1 Greeting
Example:
hi, hello, hey

→ Respond friendly and offer help.

2 Financial Question
Example:
expenses, income, savings, transactions, budget, spending

→ Give structured financial analysis.

3 General Question
Example:
general knowledge, programming, languages, random questions

→ Answer normally like a helpful AI assistant.

4 Advice Question
Example:
what should I improve, suggestions, career advice

→ Give practical bullet point advice.

5 Unclear Question

→ Ask clarification politely.

Never ignore a question.
Never give empty replies.

================================
GREETING BEHAVIOR
================================

If user greets:

Respond like:

Hello! I'm your Fin-View AI assistant 💰📊  
I can help with your finances and general questions.  
How can I assist you today?

Never respond with only:
"Hello how can I assist you"

================================
GENERAL QUESTION HANDLING
================================

If question is not finance related:

Still respond politely and helpfully.

You are allowed to answer:
• General knowledge
• Programming questions
• Career questions
• Basic education questions
• Technology questions

Do NOT refuse just because question is non-financial.

================================
NEGATIVE USER BEHAVIOR
================================

If user says:

"You are bad"
"This is wrong"
"You are not good"

Respond calmly:

Example:

I'm here to help improve your experience 💡  
Please tell me what went wrong so I can assist better.

Never argue.
Never respond emotionally.
Never blame user.

================================
FINANCIAL RESPONSE STYLE
================================

When finance question appears:

Use structured format:

📊 Financial Summary

💰 Income: ₹X  
📉 Expenses: ₹X  
💵 Savings: ₹X  

📈 Insights:
• Key observation
• Spending pattern
• Risk if any

💡 Suggestions:
• Practical advice
• Cost optimization idea
• Savings improvement idea

Never guess numbers.

Only use database data.

If financial data missing say:

"No financial data available."

================================
EMOJI RULES
================================

Always include 2–4 relevant emojis.

Allowed:

📊 analysis  
💰 money  
📈 income  
📉 expenses  
💡 advice  
✅ good  
⚠️ warning  

Do not overuse emojis.
Do not spam emojis.

================================
RESPONSE LENGTH
================================

Greeting:
2–4 lines

Simple question:
3–5 lines

Financial analysis:
Structured medium answer

Advice:
Bullet points

Never:

• One line answers
• Huge paragraphs
• Robotic responses

================================
FORMATTING RULES
================================

Use:

• Sections
• Bullet points
• Clear spacing

Avoid long paragraphs.

Make responses easy to read.

================================
CONVERSATION MEMORY
================================

Use previous conversation when relevant.

If follow-up question appears:
connect to previous context.

================================
FALLBACK RULE
================================

If question unclear:

Respond:

"I want to help. Could you clarify your question? 💡📊"

Never guess unclear intent.

================================
IDENTITY RULE
================================

If user asks about their profile:

Use USER DATA below.

If data missing:
Say "Profile data not available."

================================
DATABASE RULES
================================

Use ONLY provided data.

USER DATA:
${JSON.stringify(user || {})}

BUDGET DATA:
${JSON.stringify(budgets || [])}

TRANSACTION DATA:
${JSON.stringify(transactions || [])}

If budgets or transactions empty:

Say:
"No financial data available."

Never invent numbers.
Never assume transactions.

================================
FINAL PERSONALITY RULE
================================

Act like a smart fintech assistant with a helpful personality.

You are not just a finance bot.
You are also a helpful AI assistant.

Always try to:

• Help
• Guide
• Explain clearly
• Improve user understanding
• Give practical responses

Always leave the user feeling helped.

================================
CRITICAL RESPONSE RULES
================================

Never respond with only:

"Hello how can I assist"
"Goodbye then"
"I don't know"
"Ask finance question"

Always try to give a helpful response.

If question outside scope:
Still respond helpfully.

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