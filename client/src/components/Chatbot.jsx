import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getEnv } from "@/helpers/getEnv";
import { showToast } from "@/helpers/showToast";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // <-- Add toggle state
  const messagesEndRef = useRef(null);

  // Scroll to bottom automatically
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${getEnv("VITE_API_URL")}/chat/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Server error");
      }

      const botMsg = { sender: "bot", text: data.answer || "No response from server." };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chatbot Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <>
      {/* Chat Icon */}
      {!open && (
        <div
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-700"
          onClick={() => setOpen(true)}
        >
          💬
        </div>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[400px] flex flex-col bg-white rounded-2xl shadow-xl border">
          {/* Header */}
          <div className="bg-blue-600 text-white font-semibold text-lg p-4 rounded-t-2xl flex justify-between items-center">
            Fin-View Assistant 🤖
            <button
              className="text-white font-bold text-xl"
              onClick={() => setOpen(false)}
            >
              ✖
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-gray-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-lg max-w-[80%] break-words ${
                  m.sender === "user"
                    ? "bg-blue-200 self-end text-right"
                    : "bg-gray-200 self-start text-left"
                }`}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div className="px-3 py-2 rounded-lg bg-gray-200 text-gray-500">
                Typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-2">
            <Input
              type="text"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button onClick={sendMessage} disabled={loading}>
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
