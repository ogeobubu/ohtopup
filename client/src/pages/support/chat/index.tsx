import { useEffect, useRef, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { useQuery, useMutation } from "@tanstack/react-query";
import { sendMessage as sendMessageAPI, getChatMessages as getChatMessagesAPI, getUser } from "../../../api";

const primaryBtn =
  "inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md border border-transparent bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-dark disabled:opacity-45";

const Chat = () => {
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({ queryKey: ["user"], queryFn: getUser });
  useEffect(() => {
    if (user) setUserId(user._id);
  }, [user]);

  const {
    data: messages = [],
    refetch,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["messages", userId],
    queryFn: () => getChatMessagesAPI(userId),
    enabled: !!userId,
    refetchInterval: 10000,
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: sendMessageAPI,
    onSuccess: () => {
      setNewMessage("");
      refetch();
    },
  });

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage({ sender: userId, receiver: "6749f188695e72f734794e58", message: newMessage.trim() });
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (date: any) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  if (isLoading)
    return (
      <div className="p-12 text-center" role="status">
        <p className="text-xs text-muted">Loading chat…</p>
      </div>
    );
  if (isError)
    return (
      <div className="p-12 text-center">
        <p className="text-xs text-muted">Error loading chat.</p>
      </div>
    );

  return (
    <div>
      <div
        className="mb-4 grid gap-2.5 rounded-md bg-tint p-4"
        style={{ height: 360, overflowY: "auto", alignContent: "end" }}
      >
        {messages.map((msg: any, i: number) => (
          <div key={i} className={`flex ${msg.sender === userId ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[75%] break-word rounded-md px-3.5 py-2.5 text-[13px] leading-relaxed"
              style={{
                background: msg.sender === userId ? "var(--ot-accent)" : "var(--ot-paper)",
                color: msg.sender === userId ? "#fff" : "var(--ot-ink)",
                border: msg.sender === userId ? "none" : "1px solid var(--ot-line)",
              }}
            >
              {msg.sender !== userId && (
                <div className="mb-0.5 text-[11px] font-semibold">{msg.name || "Admin"}</div>
              )}
              {msg.message}
              <div className="mt-1 text-[10px] opacity-60">{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="h-11 flex-1 rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/40"
          placeholder="Type your message…"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={isSending || !newMessage.trim()}
          className={primaryBtn}
          aria-label="Send message"
        >
          {isSending ? "…" : <FaPaperPlane />}
        </button>
      </div>
    </div>
  );
};

export default Chat;
