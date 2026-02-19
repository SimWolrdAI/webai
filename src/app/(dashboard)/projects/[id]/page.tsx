"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import {
  Rocket,
  Globe,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ProjectData {
  id: string;
  status: string;
  tokenDraft: {
    name: string;
    symbol: string;
    description: string;
    totalSupply: string;
    website?: string;
    twitter?: string;
    telegram?: string;
  };
  siteConfig: {
    subdomain: string;
    templateId: string;
    published: boolean;
  };
  launchAttempts: {
    id: string;
    status: string;
    txSignature?: string;
    mintAddress?: string;
    errorMessage?: string;
    createdAt: string;
  }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { publicKey } = useWallet();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => setProject(d.project ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Regeneration failed");
      }
      // Refresh project data
      const projRes = await fetch(`/api/projects/${projectId}`);
      const projData = await projRes.json();
      setProject(projData.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
        <Link href="/projects" className="btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  const { tokenDraft: token, siteConfig: site } = project;

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
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{token.name}</h1>
              <span className="text-lg text-slate-400">({token.symbol})</span>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-slate-400 max-w-2xl">{token.description}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Website Card */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" /> Website
              </h2>
              {site.published && (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  Live
                </span>
              )}
            </div>
            <div className="text-sm text-slate-400 mb-4">
              <span className="text-white">{site.subdomain}</span>.yourdomain.com
            </div>
            <div className="flex gap-3">
              <Link
                href={`/site/${site.subdomain}`}
                className="btn-secondary text-sm flex items-center gap-1"
                target="_blank"
              >
                <ExternalLink className="w-3 h-3" /> Preview
              </Link>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="btn-secondary text-sm flex items-center gap-1"
              >
                {regenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Regenerate
              </button>
            </div>
          </div>

          {/* Token Info Card */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Token Details</h2>
            <div className="space-y-2 text-sm">
              <Row label="Supply" value={token.totalSupply} />
              {token.website && <Row label="Website" value={token.website} />}
              {token.twitter && <Row label="Twitter" value={token.twitter} />}
              {token.telegram && <Row label="Telegram" value={token.telegram} />}
            </div>
          </div>
        </div>

        {/* Launch Section */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Rocket className="w-5 h-5 text-amber-400" /> Pump.fun Launch
            </h2>
          </div>

          {project.status === "LAUNCHED" ? (
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span>Token launched successfully!</span>
            </div>
          ) : project.status === "FAILED" ? (
            <div>
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <XCircle className="w-5 h-5" />
                <span>Last launch attempt failed</span>
              </div>
              <Link
                href={`/projects/${project.id}/launch`}
                className="btn-primary text-sm flex items-center gap-2 w-fit"
              >
                Try Again <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-slate-400 text-sm mb-4">
                Launch your token on Pump.fun. You&apos;ll need to confirm the
                transaction in your wallet.
              </p>
              <Link
                href={`/projects/${project.id}/launch`}
                className="btn-primary text-sm flex items-center gap-2 w-fit"
              >
                Launch Token <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Launch History */}
        {project.launchAttempts.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Launch History</h2>
            <div className="space-y-3">
              {project.launchAttempts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={a.status} />
                    <span className="text-slate-400">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {a.txSignature && (
                    <a
                      href={`https://solscan.io/tx/${a.txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      View TX <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {a.errorMessage && (
                    <span className="text-red-400 text-xs">
                      {a.errorMessage}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span>{value}</span>
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
    PENDING: "bg-slate-500/20 text-slate-300",
    AWAITING_SIGNATURE: "bg-amber-500/20 text-amber-300",
    SUBMITTED: "bg-indigo-500/20 text-indigo-300",
    CONFIRMED: "bg-green-500/20 text-green-300",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${colors[status] ?? "bg-slate-500/20 text-slate-300"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

