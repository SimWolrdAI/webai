"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ExternalLink, GitBranch, Star, Clock } from "lucide-react";

interface RepoItem {
  id: number;
  name: string;
  description: string;
  url: string;
  cloneUrl: string;
  stars: number;
  language: string | null;
  createdAt: string;
  updatedAt: string;
  size: number;
}

export default function AllBotsPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRepos();
  }, []);

  async function fetchRepos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/github/repos");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRepos(data.repos ?? []);
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
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  function formatSize(kb: number) {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
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
          webai — all_bots
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 font-mono">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-[#666] hover:text-[#ccc] text-[13px] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> &gt;back
        </button>

        <h1 className="text-[#ccc] text-2xl font-bold mb-1">&gt;all_bots</h1>
        <p className="text-[#555] text-[13px] mb-8">
          &gt;all deployed bots — {repos.length} repositories on github.com/webaibot
        </p>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#555] animate-spin mb-4" />
            <p className="text-[#555] text-[13px]">&gt;fetching repos...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-[#ff5f57]/10 border border-[#ff5f57]/20 rounded-lg px-4 py-3 mb-6">
            <p className="text-[#ff5f57] text-[13px]">&gt;error: {error}</p>
            <button
              onClick={fetchRepos}
              className="text-[#ff5f57] text-[12px] mt-2 hover:text-white transition-colors"
            >
              &gt;retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && repos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <GitBranch className="w-10 h-10 text-[#333] mb-4" />
            <p className="text-[#555] text-[15px] mb-2">&gt;no bots deployed yet</p>
            <p className="text-[#444] text-[12px] mb-6">
              &gt;create a bot and push it to github
            </p>
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-2.5 rounded-lg text-[14px] text-black bg-[#ccc] hover:bg-white transition-all font-mono"
            >
              &gt;create_bot
            </button>
          </div>
        )}

        {/* Repos grid */}
        {!loading && repos.length > 0 && (
          <div className="space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_200px_80px_100px] gap-4 px-4 py-2 text-[11px] text-[#555] border-b border-[#222]">
              <span>&gt;name</span>
              <span>&gt;description</span>
              <span>&gt;size</span>
              <span>&gt;created</span>
            </div>

            {repos.map((repo) => (
              <a
                key={repo.id}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-[1fr_200px_80px_100px] gap-4 items-center bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-4 py-4 hover:border-[#333] transition-all group"
              >
                {/* Name + link */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-[#111] border border-[#222] flex items-center justify-center text-[#666] text-[12px] shrink-0 group-hover:border-[#444] transition-all">
                    &gt;
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[#ccc] text-[14px] font-bold truncate group-hover:text-white transition-colors">
                        {repo.name}
                      </span>
                      <ExternalLink className="w-3 h-3 text-[#444] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[#444] text-[11px]">
                      github.com/webaibot/{repo.name}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[#555] text-[12px] truncate">
                  {repo.description}
                </p>

                {/* Size */}
                <span className="text-[#555] text-[12px]">
                  {formatSize(repo.size)}
                </span>

                {/* Time */}
                <div className="flex items-center gap-1.5 text-[#444] text-[12px]">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo(repo.createdAt)}</span>
                </div>
              </a>
            ))}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 pt-4 border-t border-[#1a1a1a]">
              <span className="text-[#444] text-[12px]">
                &gt;{repos.length} bot{repos.length !== 1 ? "s" : ""} deployed
              </span>
              <a
                href="https://github.com/webaibot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#555] text-[12px] hover:text-[#ccc] transition-colors"
              >
                <GitBranch className="w-3 h-3" />
                &gt;view all on github
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

