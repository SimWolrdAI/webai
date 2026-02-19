"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import Link from "next/link";
import {
  Rocket,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Loader2,
  XCircle,
} from "lucide-react";

type LaunchStep = "prepare" | "signing" | "confirming" | "success" | "error";

export default function LaunchPage() {
  const params = useParams();
  const router = useRouter();
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const projectId = params.id as string;

  const [step, setStep] = useState<LaunchStep>("prepare");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  if (!connected || !publicKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <Rocket className="w-16 h-16 text-indigo-400 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Connect Wallet to Launch</h1>
        <WalletMultiButton />
      </div>
    );
  }

  async function handleLaunch() {
    if (!publicKey || !signTransaction) return;

    setLoading(true);
    setError(null);
    setStep("prepare");

    try {
      // Step 1: Prepare launch payload
      const prepRes = await fetch(`/api/projects/${projectId}/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare",
          walletAddress: publicKey.toBase58(),
        }),
      });

      if (!prepRes.ok) {
        const d = await prepRes.json();
        throw new Error(d.error ?? "Failed to prepare launch");
      }

      const { attemptId, payload } = await prepRes.json();
      setEstimatedCost(payload.estimatedCostSol ?? null);

      // Step 2: Sign transaction
      setStep("signing");

      let userTxSignature: string | undefined;

      if (payload.method === "onchain" && payload.transaction) {
        // Deserialize and sign
        const txBuffer = Buffer.from(payload.transaction, "base64");
        const tx = Transaction.from(txBuffer);
        const signed = await signTransaction(tx);
        const rawTx = signed.serialize();
        const sig = await connection.sendRawTransaction(rawTx);
        userTxSignature = sig;
      }

      // Step 3: Confirm
      setStep("confirming");

      const confirmRes = await fetch(`/api/projects/${projectId}/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          attemptId,
          txSignature: userTxSignature,
        }),
      });

      const result = await confirmRes.json();

      if (result.success) {
        setTxSignature(result.txSignature ?? userTxSignature ?? null);
        setStep("success");
      } else {
        throw new Error(result.error ?? "Launch failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    } finally {
      setLoading(false);
    }
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

      <div className="max-w-lg mx-auto px-6 py-16">
        <Link
          href={`/projects/${projectId}`}
          className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Project
        </Link>

        <div className="glass-card p-8">
          {/* Prepare / Initial */}
          {step === "prepare" && !loading && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Rocket className="w-8 h-8 text-amber-400" />
                <h1 className="text-2xl font-bold">Launch on Pump.fun</h1>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-200">
                    <p className="font-semibold mb-1">Before you launch:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-300/80">
                      <li>This action is irreversible</li>
                      <li>You will need SOL in your wallet for fees (~0.02 SOL)</li>
                      <li>You will be asked to sign a transaction in your wallet</li>
                      <li>Make sure your token details are correct</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLaunch}
                className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
              >
                <Rocket className="w-5 h-5" /> Launch Token
              </button>
            </>
          )}

          {/* Loading states */}
          {(step === "prepare" || step === "signing" || step === "confirming") &&
            loading && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-6" />
                <h2 className="text-xl font-bold mb-2">
                  {step === "prepare" && "Preparing launch..."}
                  {step === "signing" && "Waiting for wallet signature..."}
                  {step === "confirming" && "Confirming on-chain..."}
                </h2>
                <p className="text-slate-400 text-sm">
                  {step === "signing" &&
                    "Please approve the transaction in your wallet"}
                  {step === "confirming" &&
                    "This may take a few seconds..."}
                </p>
                {estimatedCost && (
                  <p className="text-sm text-slate-500 mt-4">
                    Estimated cost: ~{estimatedCost} SOL
                  </p>
                )}
              </div>
            )}

          {/* Success */}
          {step === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">Token Launched!</h2>
              <p className="text-slate-400 mb-6">
                Your token has been successfully launched on Pump.fun.
              </p>
              {txSignature && (
                <a
                  href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:underline text-sm block mb-6"
                >
                  View Transaction on Solscan →
                </a>
              )}
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="btn-primary"
              >
                Back to Project
              </button>
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">Launch Failed</h2>
              <p className="text-red-300 text-sm mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setStep("prepare");
                    setError(null);
                  }}
                  className="btn-primary"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push(`/projects/${projectId}`)}
                  className="btn-secondary"
                >
                  Back to Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

