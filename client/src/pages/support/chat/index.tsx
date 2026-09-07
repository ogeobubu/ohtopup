import { useEffect, useRef, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { useQuery, useMutation } from "@tanstack/react-query";
import { sendMessage as sendMessageAPI, getChatMessages as getChatMessagesAPI, getUser } from "../../../api";

const Chat = () => {
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const bottomRef = useRef(null);

  const { data: user } = useQuery({ queryKey: ['user'], queryFn: getUser });
  useEffect(() => { if (user) setUserId(user._id); }, [user]);

  const { data: messages = [], refetch, isLoading, isError } = useQuery({
    queryKey: ['messages', userId],
    queryFn: () => getChatMessagesAPI(userId),
    enabled: !!userId,
    refetchInterval: 10000,
  });

  const { mutate: sendMessage, isLoading: isSending } = useMutation({
    mutationFn: sendMessageAPI,
    onSuccess: () => { setNewMessage(""); refetch(); },
  });

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage({ sender: userId, receiver: "6749f188695e72f734794e58", message: newMessage.trim() });
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (isLoading) return <div className="ot-empty" role="status"><p>Loading chat…</p></div>;
  if (isError) return <div className="ot-empty"><p>Error loading chat.</p></div>;

  return (
    <div>
      <div style={{ height: 360, overflowY: 'auto', padding: 16, background: 'var(--ot-tint)', borderRadius: 6, marginBottom: 16, display: 'grid', gap: 10, alignContent: 'end' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.sender === userId ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: 6, background: msg.sender === userId ? 'var(--ot-accent)' : 'var(--ot-paper)', color: msg.sender === userId ? '#fff' : 'var(--ot-ink)', border: msg.sender === userId ? 'none' : '1px solid var(--ot-line)', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
              {msg.sender !== userId && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{msg.name || 'Admin'}</div>}
              {msg.message}
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" className="ot-field" style={{ flex: 1 }} placeholder="Type your message…" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }} />
        <button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()} className="ot-button ot-button-primary" style={{ padding: '8px 16px', minHeight: 'auto' }}>{isSending ? "…" : <FaPaperPlane />}</button>
      </div>
    </div>
  );
};

export default Chat;
