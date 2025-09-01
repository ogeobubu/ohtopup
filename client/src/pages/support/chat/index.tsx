import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { useQuery, useMutation } from "@tanstack/react-query";
import { sendMessage as sendMessageAPI, getChatMessages as getChatMessagesAPI, getUser } from "../../../api"; // Adjust path accordingly

type ChatMessage = {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  timestamp: string | number | Date;
  name?: string;
};

const Chat = () => {
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const adminName = "Admin";
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: user, isLoading: isUserLoading, isError: isUserError } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  useEffect(() => {
    if(user) {
      setUserId(user?._id)
    }
  }, [user])

  // Fetching chat messages using useQuery
  const { data: messages = [], refetch, isLoading, isError } = useQuery<ChatMessage[]>({
    queryKey: ['messages', userId], 
    queryFn: () => getChatMessagesAPI(userId as string),
    enabled: !!userId,
    refetchInterval: 10000,
  });

  // Mutation to send a message
  const { mutate: sendMessage, isLoading: isSending } = useMutation({
    mutationFn: sendMessageAPI,  // The mutation function
    onSuccess: () => {
      setNewMessage(""); // Clear input after sending
      refetch(); // Refetch messages after sending a new message
    },
    onError: (error) => {
    },
  });

  // Function to handle sending a message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messageData = {
        sender: userId,
        receiver: "6749f188695e72f734794e58",
        message: newMessage.trim(),
      };

      sendMessage(messageData);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to format the time to a readable format
  const formatTime = (date) => {
    const hours = date?.getHours();
    const minutes = date?.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  if (isUserLoading) return <p>Loading user data...</p>;
  if (isUserError) return <p>Error fetching user data</p>;

  if (isLoading) return <p>Loading chat messages...</p>;
  if (isError) return <p>Error fetching messages</p>;

  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Chat Us</h2>
      
      {/* Chat Messages */}
      <div className="h-80 overflow-auto mb-4 p-4 bg-gray-100 rounded-lg space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === userId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs p-3 rounded-lg ${msg.sender === userId ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
              {msg.sender === "6749f188695e72f734794e58" && (
                <>
                  <div className="font-bold text-sm">{msg.name || adminName}</div>
                  <div className="text-xs text-gray-500">{formatTime(new Date(msg.timestamp as any))}</div>
                </>
              )}
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
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
          onClick={handleSendMessage}
          className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          disabled={isSending}
        >
          {isSending ? "Sending..." : <FaPaperPlane size={18} />}
        </button>
      </div>
    </div>
  );
};

export default Chat;
