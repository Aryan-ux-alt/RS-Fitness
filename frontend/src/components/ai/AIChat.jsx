import { useState, useRef, useEffect } from "react";
import { C } from "../../constants/data";
import styles from "./AIChat.module.css";
import * as api from "../../services/api";

export default function AIChat({ context = "general" }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your AI fitness coach. Ask me anything about workouts, nutrition, or fitness! 💪" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      // Use the api.request function which has auto-token-refresh built in
      const data = await api.request("/ai/ask", {
        method: "POST",
        body: JSON.stringify({
          message: input,
          context,
        }),
      });

      console.log("[AIChat] Got response:", data.response ? `${data.response.substring(0, 50)}...` : "empty");
      
      // Add assistant response
      setMessages(prev => [...prev, { role: "assistant", text: data.response }]);
    } catch (err) {
      console.error("[AIChat] Error:", err);
      setError(err.message);
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: "assistant", 
        text: `Sorry, I couldn't process that. ${err.message}`,
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h3>🤖 AI Fitness Coach</h3>
        <p className={styles.subtitle}>Ask unlimited questions!</p>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.message} ${styles[msg.role]} ${msg.isError ? styles.error : ""}`}>
            <div className={styles.avatar}>
              {msg.role === "user" ? "👤" : "🤖"}
            </div>
            <div className={styles.content}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.avatar}>🤖</div>
            <div className={styles.content}>
              <div className={styles.typing}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className={styles.errorBanner}>
          ⚠️ {error}
        </div>
      )}

      <div className={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Ask me anything about fitness..."
          disabled={loading}
          className={styles.input}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          className={styles.sendBtn}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>

      <div className={styles.hints}>
        <small>💡 Try: "Best exercises for chest?", "How many calories in Biryani?", "Pre-workout meal tips?"</small>
      </div>
    </div>
  );
}
