export default function ChatBubble({ from, text }) {
  return (
    <div className={from === "ai" ? "chat-ai" : "chat-user"}>
      {text}
    </div>
  );
}
