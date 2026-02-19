"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { Rocket, Plus, ExternalLink, Globe } from "lucide-react";

interface Project {
  id: string;
  status: string;
  createdAt: string;
  tokenDraft: {
    name: string;
    symbol: string;
    description: string;
  } | null;
  siteConfig: {
    subdomain: string;
    published: boolean;
  } | null;
}

export default function ProjectsPage() {
  const { publicKey, connected } = useWallet();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    fetch(`/api/projects?wallet=${publicKey.toBase58()}`)
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [publicKey]);

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <Rocket className="w-16 h-16 text-indigo-400 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-slate-400 mb-8">
          Connect your wallet to view your projects.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Rocket className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-bold gradient-text">AI Launchpad</span>
        </Link>
        <WalletMultiButton />
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <Link href="/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Rocket className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-slate-400 mb-6">
              Create your first token project to get started.
            </p>
            <Link href="/create" className="btn-primary">
              Create Project
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="glass-card p-6 flex items-center justify-between hover:bg-white/5 transition-colors block"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold">
                      {p.tokenDraft?.name ?? "Unnamed"}{" "}
                      <span className="text-slate-400 text-sm">
                        ({p.tokenDraft?.symbol ?? "???"})
                      </span>
                    </h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-1">
                    {p.tokenDraft?.description ?? "No description"}
                  </p>
                  {p.siteConfig?.subdomain && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-indigo-400">
                      <Globe className="w-3 h-3" />
                      {p.siteConfig.subdomain}.yourdomain.com
                    </div>
                  )}
                </div>
                <ExternalLink className="w-5 h-5 text-slate-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-slate-500/20 text-slate-300",
    SITE_GENERATING: "bg-amber-500/20 text-amber-300",
    SITE_PUBLISHED: "bg-emerald-500/20 text-emerald-300",
    LAUNCHING: "bg-indigo-500/20 text-indigo-300",
    LAUNCHED: "bg-green-500/20 text-green-300",
    FAILED: "bg-red-500/20 text-red-300",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${colors[status] ?? "bg-slate-500/20 text-slate-300"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

