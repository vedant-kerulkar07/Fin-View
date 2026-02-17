import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messages: [
      {
        message: {
          type: String,
          required: true,
        },

        normalizedMessage: {
          type: String,
          required: true,
          index: true, // ⚡ fast lookup
        },

        response: {
          type: String,
          required: true,
        },

        isFinancial: {
          type: Boolean,
          default: false,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
