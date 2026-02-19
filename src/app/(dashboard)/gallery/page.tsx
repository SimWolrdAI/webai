"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, MessageSquare, Loader2, Github } from "lucide-react";

interface BotItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  template: string | null;
  message_count: number;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  telegram: "📡",
  discord: "🎮",
  web: "🌐",
};

export default function GalleryPage() {
  const router = useRouter();
  const [bots, setBots] = useState<BotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBots();
  }, []);

  async function fetchBots() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bots?limit=50");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setBots(data.bots ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Title bar */}
      <div className="h-[38px] bg-[#1a1a1a] flex items-center px-4 gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-[6px]">
          <div className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
          <div className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
          <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[12px] text-[#666] flex-1 text-center">
          webai — gallery
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 font-mono">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-[#666] hover:text-[#ccc] text-[13px] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> &gt;main menu
        </button>

        <h1 className="text-[#ccc] text-2xl font-bold mb-2">&gt;Gallery</h1>
        <p className="text-[#555] text-[13px] mb-8">
          &gt;Community bots — {bots.length} published
        </p>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#555] animate-spin mb-4" />
            <p className="text-[#555] text-[13px]">&gt;Loading...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-[#ff5f57]/10 border border-[#ff5f57]/20 rounded-lg px-4 py-3 mb-6">
            <p className="text-[#ff5f57] text-[13px]">&gt;Error: {error}</p>
          </div>
        )}

        {!loading && !error && bots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageSquare className="w-10 h-10 text-[#333] mb-4" />
            <p className="text-[#555] text-[15px] mb-2">&gt;No bots yet</p>
            <p className="text-[#444] text-[12px] mb-6">&gt;Be the first to create an AI bot</p>
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-2.5 rounded-lg text-[14px] text-black bg-[#ccc] hover:bg-white transition-all"
            >
              &gt;Create Bot
            </button>
          </div>
        )}

        {!loading && bots.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots.map((bot) => (
              <a
                key={bot.id}
                href={`/b/${bot.slug}`}
                className="bg-[#111] border border-[#222] rounded-lg p-5 hover:border-[#444] transition-all group block"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#ccc] text-[16px] mb-3 group-hover:border-[#555] transition-all">
                  &gt;
                </div>
                <h3 className="text-[#ccc] text-[15px] font-bold mb-1 truncate">
                  {bot.name}
                </h3>
                {bot.description && (
                  <p className="text-[#555] text-[12px] line-clamp-2 mb-3 leading-relaxed">
                    {bot.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-[11px] text-[#444]">
                  <div className="flex items-center gap-3">
                    {bot.template && (
                      <span className="bg-[#1a1a1a] px-2 py-0.5 rounded">
                        {bot.template}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {bot.message_count}
                    </span>
                  </div>
                  <span>{timeAgo(bot.created_at)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
