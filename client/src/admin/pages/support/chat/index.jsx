import React, { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

const Chat = () => {
  const [messages, setMessages] = useState([]); // Store messages
  const [newMessage, setNewMessage] = useState(""); // Store the new message
  const adminName = "Admin"; // Name of the admin

  // Function to format the time to a readable format
  const formatTime = (date) => {
    const hours = date?.getHours();
    const minutes = date?.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Function to handle sending the message
  const sendMessage = () => {
    if (newMessage.trim()) {
      const currentTime = new Date();
      setMessages([
        ...messages,
        { sender: "user", content: newMessage.trim(), time: currentTime },
        { sender: "admin", content: "Hello, how can I assist you today?", time: new Date(), name: adminName },
      ]);
      setNewMessage(""); // Reset the input field after sending the message
    }
  };

  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Chat Us</h2>
      
      {/* Chat Messages */}
      <div className="h-80 overflow-auto mb-4 p-4 bg-gray-100 rounded-lg space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs p-3 rounded-lg ${
                msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
              }`}
            >
              {msg.sender === "admin" && (
                <>
                  <div className="font-bold text-sm">{msg.name}</div>
                  <div className="text-xs text-gray-500">{formatTime(msg.time)}</div>
                </>
              )}
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      {/* Message Input and Send Button */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          <FaPaperPlane size={18} />
        </button>
      </div>
    </div>
  );
};

export default Chat;
