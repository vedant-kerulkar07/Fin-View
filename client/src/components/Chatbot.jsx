import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getEnv } from "@/helpers/getEnv";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef(null);

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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const botMsg = {
        sender: "bot",
        text: data.answer || "No response from server.",
      };

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
      {/* Floating Button */}
      {!open && (
        <div
          onClick={() => setOpen(true)}
          className="fixed z-50 bottom-5 right-5 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all duration-300"
        >
          💬
        </div>
      )}

      {/* Chat Window */}
      <div
        className={`fixed z-50 flex flex-col shadow-2xl backdrop-blur-lg bg-white/80 border transition-all duration-300
        
        /* Animation */
        ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
        
        /* Desktop */
        md:bottom-6 md:right-6 md:w-[360px] md:h-[420px] md:rounded-2xl
        
        /* Mobile */
        bottom-0 right-0 w-full h-[85vh] rounded-t-2xl`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm md:text-lg p-3 md:p-4 rounded-t-2xl flex justify-between items-center">
          Fin-View Assistant 🤖
          <button
            onClick={() => setOpen(false)}
            className="hover:scale-125 transition"
          >
            ✖
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                m.sender === "user"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white ml-auto"
                  : "bg-gray-200 text-gray-800 mr-auto"
              }`}
            >
              {m.text}
            </div>
          ))}

          {/* Typing Animation */}
          {loading && (
            <div className="flex items-center gap-1 bg-gray-200 w-fit px-3 py-2 rounded-2xl">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 md:p-3 border-t flex gap-2 bg-white/60 backdrop-blur-md">
          <Input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="rounded-full text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={loading}
            className="rounded-full px-4 md:px-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105 transition"
          >
            ➤
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatBot;