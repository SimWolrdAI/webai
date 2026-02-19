"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Trash2, Loader2,
  Copy, Check, Github, Globe, Clock,
} from "lucide-react";
import {
  fetchBots,
  deleteBotFromServer,
  type SavedBot,
} from "@/lib/browser-bots";

export default function MyBotsPage() {
  const router = useRouter();
  const [bots, setBots] = useState<SavedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadBots();
  }, []);

  async function loadBots() {
    setLoading(true);
    const data = await fetchBots();
    setBots(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteBotFromServer(id);
    setBots((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(null);
  }

  async function handleCopy(bot: SavedBot) {
    await navigator.clipboard.writeText(bot.url);
    setCopiedId(bot.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
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
          webai — my_bots
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 font-mono">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-[#666] hover:text-[#ccc] text-[13px] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> &gt;back
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#ccc] text-2xl font-bold mb-1">&gt;my_bots</h1>
            <p className="text-[#555] text-[13px]">
              &gt;{bots.length} bot{bots.length !== 1 ? "s" : ""} created
            </p>
          </div>
          <button
            onClick={() => router.push("/create")}
            className="px-5 py-2.5 rounded-lg text-[14px] text-black bg-[#ccc] hover:bg-white transition-all font-mono"
          >
            &gt;new_bot
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#555] animate-spin mb-4" />
            <p className="text-[#555] text-[13px]">&gt;loading your bots...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && bots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-xl bg-[#111] border border-[#222] flex items-center justify-center text-[#444] text-[22px] mb-4">
              &gt;
            </div>
            <p className="text-[#555] text-[15px] mb-2">&gt;no bots yet</p>
            <p className="text-[#444] text-[12px] mb-6">
              &gt;create a bot, push to github or publish — it will appear here
            </p>
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-2.5 rounded-lg text-[14px] text-black bg-[#ccc] hover:bg-white transition-all font-mono"
            >
              &gt;create_bot
            </button>
          </div>
        )}

        {/* Bots list */}
        {!loading && bots.length > 0 && (
          <div className="space-y-3">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#333] transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Type icon */}
                  <div className="w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center shrink-0 group-hover:border-[#444] transition-all">
                    {bot.type === "github" ? (
                      <Github className="w-4 h-4 text-[#888]" />
                    ) : (
                      <Globe className="w-4 h-4 text-[#888]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#ccc] text-[14px] font-bold truncate">
                      {bot.name}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-[#555] mt-1">
                      <span className="bg-[#111] px-2 py-0.5 rounded text-[10px]">
                        {bot.type === "github" ? "github" : "webai"}
                      </span>
                      {bot.description && (
                        <span className="truncate max-w-[200px]">{bot.description}</span>
                      )}
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" /> {timeAgo(bot.createdAt)}
                      </span>
                    </div>
                    <p className="text-[#444] text-[11px] mt-0.5 truncate">{bot.url}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(bot)}
                      className="px-2.5 py-2 rounded-lg text-[12px] text-[#666] bg-[#111] hover:bg-[#1a1a1a] border border-[#222] transition-all"
                      title="Copy link"
                    >
                      {copiedId === bot.id ? (
                        <Check className="w-3 h-3 text-[#28c840]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <a
                      href={bot.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg text-[12px] text-[#666] bg-[#111] hover:bg-[#1a1a1a] hover:text-[#ccc] border border-[#222] flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" /> &gt;open
                    </a>
                    <button
                      onClick={() => handleDelete(bot.id)}
                      disabled={deletingId === bot.id}
                      className="px-2.5 py-2 rounded-lg text-[12px] text-[#444] hover:text-[#ff5f57] bg-[#111] hover:bg-[#ff5f57]/10 border border-[#222] transition-all disabled:opacity-30"
                    >
                      {deletingId === bot.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
