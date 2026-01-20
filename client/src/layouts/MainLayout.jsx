import ChatBot from "@/components/Chatbot";
import Topbar from "@/components/Topbar";
import React from "react";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-[#3AAFA9]">
      {/* Topbar (not fixed now) */}
      <Topbar />

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <ChatBot />
    </div>
  );
};

export default MainLayout;
