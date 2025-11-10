import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Chatbot = () => {
  const chatbotURL =
    "";

  // const openChatbot = () => {
  //   window.open(
  //     chatbotURL,
  //     "n8nChatbot",
  //     "width=450,height=600,top=100,right=50,resizable,scrollbars"
  //   );
  // };

  return (
    <Button
      // onClick={openChatbot}
      className="fixed bottom-6 right-6 rounded-full p-4 shadow-lg bg-blue-600 hover:bg-blue-700 text-white z-[1000]"
      size="icon"
    >
      <MessageCircle className="w-6 h-6" />
    </Button>
  );
};

export default Chatbot;
