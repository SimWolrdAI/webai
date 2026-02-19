"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Send, ArrowLeft } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BotInfo {
  name: string;
  description: string;
  slug: string;
}

export default function BotChatPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [bot, setBot] = useState<BotInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch bot info
  useEffect(() => {
    async function fetchBot() {
      try {
        const res = await fetch(`/api/bots?limit=1&slug=${slug}`);
        // fallback: just try to chat, if bot doesn't exist we'll get 404
        setBot({ name: slug, description: "", slug });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchBot();
  }, [slug]);

  // Fetch bot details separately
  useEffect(() => {
    async function loadBotInfo() {
      try {
        const res = await fetch(`/api/bot-info/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setBot(data);
        }
      } catch {
        // use slug as name
      }
    }
    loadBotInfo();
  }, [slug]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
  useEffect(() => {
    if (!streaming) inputRef.current?.focus();
  }, [streaming]);

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setError(null);

    // Add empty assistant message for streaming
    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch(`/api/chat/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Chat failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: fullContent,
                    };
                    return updated;
                  });
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Remove empty assistant message on error
      setMessages(newMessages);
    } finally {
      setStreaming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#555] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Terminal title bar */}
      <div className="h-[38px] bg-[#1a1a1a] flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center gap-[6px]">
          <a
            href="/"
            className="w-[11px] h-[11px] rounded-full bg-[#ff5f57] hover:brightness-110 transition block"
          />
          <div className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
          <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[12px] text-[#666] flex-1 text-center">
          webai — {bot?.name || slug}
        </span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0">
        <div className="max-w-2xl mx-auto py-6 font-mono">
          {/* Welcome */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 rounded-xl bg-[#111] border border-[#222] flex items-center justify-center text-[#ccc] text-[24px] mb-4">
                &gt;
              </div>
              <h2 className="text-[#ccc] text-[20px] font-bold mb-2">
                {bot?.name || slug}
              </h2>
              {bot?.description && (
                <p className="text-[#555] text-[13px] text-center max-w-md mb-6">
                  {bot.description}
                </p>
              )}
              <p className="text-[#444] text-[12px]">
                &gt;Type a message to start chatting
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className="mb-4">
              {msg.role === "user" ? (
                <div className="flex items-start gap-3">
                  <span className="text-[#28c840] text-[13px] shrink-0 mt-0.5 select-none">
                    you@webai ~$
                  </span>
                  <p className="text-[#ccc] text-[14px] whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 mt-1">
                  <span className="text-[#888] text-[13px] shrink-0 mt-0.5 select-none">
                    {(bot?.name || slug).toLowerCase().replace(/\s+/g, "")}:
                  </span>
                  <div className="text-[#bbb] text-[14px] whitespace-pre-wrap break-words leading-relaxed min-h-[20px]">
                    {msg.content || (
                      <span className="inline-flex items-center gap-1.5 text-[#555]">
                        <Loader2 className="w-3 h-3 animate-spin" /> thinking...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="mb-4 text-[#ff5f57] text-[13px]">
              &gt;error: {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-[#28c840] font-mono text-[13px] shrink-0 select-none">
            &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            disabled={streaming}
            className="flex-1 bg-transparent text-[#ccc] font-mono text-[14px] placeholder-[#444] focus:outline-none disabled:opacity-50"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            className="w-8 h-8 rounded-lg bg-[#222] hover:bg-[#333] flex items-center justify-center text-[#888] hover:text-[#ccc] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {streaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

