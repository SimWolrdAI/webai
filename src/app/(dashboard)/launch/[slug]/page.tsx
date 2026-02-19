"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import {
  ArrowLeft,
  Upload,
  Loader2,
  X,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";

type LaunchStep = "form" | "signing" | "confirming" | "success" | "error";

export default function LaunchTokenPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { publicKey, signTransaction, connected, disconnect } =
    useWallet();
  const { connection } = useConnection();

  // Form state
  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [buyAmount, setBuyAmount] = useState("0.001");

  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Launch state
  const [step, setStep] = useState<LaunchStep>("form");
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Auto-fill website URL
  useEffect(() => {
    if (slug) {
      setWebsite(`${window.location.origin}/s/${slug}`);
    }
  }, [slug]);

  /* ── Logo handlers ── */
  function processFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo file too large (max 5MB)");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  function handleRemoveLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ── Launch ── */
  async function handleLaunch() {
    if (!tokenName.trim() || !symbol.trim() || !description.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    if (!logoFile && !logoPreview) {
      setError("Please upload a token logo");
      return;
    }
    if (!connected || !publicKey || !signTransaction) {
      setError("Please connect your wallet first");
      return;
    }

    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount < 0.001) {
      setError("Minimum buy amount is 0.001 SOL");
      return;
    }

    setLaunching(true);
    setError(null);
    setStep("form");

    try {
      // Step 1: Prepare the launch
      setStep("signing");

      const formData = new FormData();
      formData.append("tokenName", tokenName.trim());
      formData.append("symbol", symbol.trim().toUpperCase());
      formData.append("description", description.trim());
      formData.append("website", website.trim());
      formData.append("twitter", twitter.trim());
      formData.append("telegram", telegram.trim());
      formData.append("buyAmount", buyAmount);
      formData.append("walletAddress", publicKey.toBase58());
      formData.append("slug", slug);
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await fetch("/api/launch-token", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Launch preparation failed");
      }

      // If the API returns a transaction to sign (real Pump.fun integration)
      if (data.transaction) {
        const txBuffer = Buffer.from(data.transaction, "base64");
        const tx = Transaction.from(txBuffer);
        const signed = await signTransaction(tx);
        const rawTx = signed.serialize();
        const sig = await connection.sendRawTransaction(rawTx);
        setTxSignature(sig);

        // Confirm on-chain
        setStep("confirming");
        await connection.confirmTransaction(sig, "confirmed");
      }

      // If no transaction (demo mode), just show success
      setStep("success");
    } catch (err) {
      console.error("Launch error:", err);
      setError(err instanceof Error ? err.message : "Launch failed");
      setStep("error");
    } finally {
      setLaunching(false);
    }
  }

  /* ── Validation ── */
  const canLaunch =
    tokenName.trim() &&
    symbol.trim() &&
    description.trim() &&
    (logoFile || logoPreview) &&
    connected &&
    publicKey;

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-black">
      {/* Terminal title bar */}
      <div className="h-[38px] bg-[#1a1a1a] flex items-center px-4 gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-[6px]">
          <div className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
          <div className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
          <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[12px] text-[#666] flex-1 text-center">
          webai — launch token
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 font-mono">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-[#666] hover:text-[#ccc] text-[13px] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> &gt;main menu
        </button>

        {/* Title */}
        <h1 className="text-[#ccc] text-2xl font-bold mb-3">
          &gt;Launch Your Token on Pump.fun
        </h1>

        {/* Status banner */}
        <div className="bg-[#28c840]/10 border border-[#28c840]/20 rounded-lg px-4 py-3 mb-8 flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-[#28c840] shrink-0" />
          <p className="text-[#28c840] text-[13px]">
            &gt;Your website is ready! Now complete your token launch.
          </p>
        </div>

        {/* ═══ FORM ═══ */}
        {(step === "form" || step === "signing") && !launching ? (
          <div className="space-y-8">
            {/* ── Token Details ── */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-[3px] h-5 bg-[#ccc] rounded-full" />
                <h2 className="text-[#ccc] text-lg font-bold">Token Details</h2>
              </div>

              <div className="space-y-5 pl-4">
                {/* Token Name */}
                <div>
                  <label className="text-[#888] text-[13px] block mb-2">
                    &gt;Token Name{" "}
                    <span className="text-[#ff5f57]">*</span>{" "}
                    <span className="text-[#555] text-[11px]">(Required)</span>
                  </label>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="Pick a name for your token"
                    className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-[14px] text-[#ccc] placeholder-[#444] focus:outline-none focus:border-[#444] transition-colors"
                  />
                  <p className="text-[#444] text-[11px] mt-1.5">
                    &gt;Pick a name for your token
                  </p>
                </div>

                {/* Symbol */}
                <div>
                  <label className="text-[#888] text-[13px] block mb-2">
                    &gt;Symbol{" "}
                    <span className="text-[#ff5f57]">*</span>{" "}
                    <span className="text-[#555] text-[11px]">(Required)</span>
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) =>
                      setSymbol(e.target.value.toUpperCase().slice(0, 10))
                    }
                    placeholder="e.g. MEME"
                    className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-[14px] text-[#ccc] placeholder-[#444] focus:outline-none focus:border-[#444] transition-colors"
                  />
                  <p className="text-[#444] text-[11px] mt-1.5">
                    &gt;e.g. MEME, up to 10 chars
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[#888] text-[13px] block mb-2">
                    &gt;Description{" "}
                    <span className="text-[#ff5f57]">*</span>{" "}
                    <span className="text-[#555] text-[11px]">(Required)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the purpose of your token..."
                    rows={3}
                    className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-[14px] text-[#ccc] placeholder-[#444] resize-none focus:outline-none focus:border-[#444] transition-colors"
                  />
                  <p className="text-[#444] text-[11px] mt-1.5">
                    &gt;Brief description for your token
                  </p>
                </div>
              </div>
            </section>

            {/* ── Social & Links ── */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-[3px] h-5 bg-[#ccc] rounded-full" />
                <h2 className="text-[#ccc] text-lg font-bold">
                  Social & Links
                </h2>
              </div>

              <div className="space-y-5 pl-4">
                {/* Website (auto-filled) */}
                <div>
                  <label className="text-[#888] text-[13px] block mb-2">
                    &gt;Website{" "}
                    <span className="text-[#555] text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://pump.fun/your-token"
                    className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-[14px] text-[#ccc] placeholder-[#444] focus:outline-none focus:border-[#444] transition-colors"
                  />
                </div>

                {/* Twitter */}
                <div>
                  <label className="text-[#888] text-[13px] block mb-2">
                    &gt;Twitter{" "}
                    <span className="text-[#555] text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@mytoken"
                    className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-[14px] text-[#ccc] placeholder-[#444] focus:outline-none focus:border-[#444] transition-colors"
                  />
                </div>

                {/* Telegram */}
                <div>
                  <label className="text-[#888] text-[13px] block mb-2">
                    &gt;Telegram{" "}
                    <span className="text-[#555] text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="t.me/mychannel"
                    className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-[14px] text-[#ccc] placeholder-[#444] focus:outline-none focus:border-[#444] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* ── Token Assets ── */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-[3px] h-5 bg-[#ccc] rounded-full" />
                <h2 className="text-[#ccc] text-lg font-bold">Token Assets</h2>
              </div>

              <div className="space-y-5 pl-4">
                {/* Logo Upload */}
                <div>
                  <label className="text-[#888] text-[13px] block mb-2">
                    &gt;Token Logo{" "}
                    <span className="text-[#ff5f57]">*</span>{" "}
                    <span className="text-[#555] text-[11px]">(Required)</span>
                  </label>

                  {logoPreview ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-[#111] border border-[#222] group">
                      <img
                        src={logoPreview}
                        alt="Token logo"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 hover:bg-black rounded-full flex items-center justify-center text-[#888] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full rounded-lg bg-[#111] border ${
                        dragOver
                          ? "border-[#ccc] bg-[#ccc]/5"
                          : "border-dashed border-[#333] hover:border-[#555]"
                      } flex items-center gap-4 px-4 py-4 cursor-pointer transition-all`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
                        <Upload className="w-5 h-5 text-[#555]" />
                      </div>
                      <div>
                        <p className="text-[#888] text-[13px]">
                          &gt;Drop image here or click to upload
                        </p>
                        <p className="text-[#444] text-[11px] mt-0.5">
                          Recommended: 512×512 PNG or JPG
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Buy Amount */}
                <div>
                  <label className="text-[#888] text-[13px] block mb-2">
                    &gt;Buy amount{" "}
                    <span className="text-[#ff5f57]">*</span>{" "}
                    <span className="text-[#555] text-[11px]">(Required)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={buyAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setBuyAmount(val);
                      }}
                      placeholder="0.001"
                      className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-[14px] text-[#ccc] placeholder-[#444] focus:outline-none focus:border-[#444] transition-colors pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] text-[14px] font-bold">
                      SOL
                    </span>
                  </div>
                  <p className="text-[#444] text-[11px] mt-1.5">
                    &gt;Minimum 0.001 SOL recommended
                  </p>
                </div>
              </div>
            </section>

            {/* ── Wallet & Launch ── */}
            <section className="pt-4 border-t border-[#1a1a1a]">
              {error && (
                <div className="mb-4 bg-[#ff5f57]/10 border border-[#ff5f57]/20 rounded-lg px-4 py-3">
                  <p className="text-[#ff5f57] text-[13px]">
                    &gt;Error: {error}
                  </p>
                </div>
              )}

              {/* Wallet connection */}
              <div className="mb-6">
                {connected && publicKey ? (
                  <div className="flex items-center justify-between bg-[#111] border border-[#222] rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#28c840]" />
                      <span className="text-[#888] text-[13px]">
                        &gt;Wallet Connected
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#555] text-[12px]">
                        {publicKey.toBase58().slice(0, 4)}...
                        {publicKey.toBase58().slice(-4)}
                      </span>
                      <button
                        onClick={() => disconnect()}
                        className="text-[#555] hover:text-[#ff5f57] text-[11px] transition-colors"
                      >
                        &gt;disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="wallet-terminal-btn">
                    <WalletMultiButton />
                  </div>
                )}
              </div>

              {/* Launch button */}
              <button
                onClick={handleLaunch}
                disabled={!canLaunch || launching}
                className="w-full py-4 rounded-lg font-bold text-[16px] text-black bg-[#ccc] hover:bg-white flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {launching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />{" "}
                    &gt;Launching...
                  </>
                ) : (
                  <>&gt;Launch Token on Pump.fun</>
                )}
              </button>

              <p className="text-[#444] text-[11px] text-center mt-3">
                &gt;This will create your token on Pump.fun and require a wallet
                signature
              </p>
            </section>
          </div>
        ) : null}

        {/* ═══ SIGNING / CONFIRMING ═══ */}
        {launching && (step === "signing" || step === "confirming") && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#333] border-t-[#ccc] rounded-full animate-spin mb-6" />
            <h2 className="text-[#ccc] text-xl font-bold mb-2">
              {step === "signing" && ">Waiting for wallet signature..."}
              {step === "confirming" && ">Confirming on-chain..."}
            </h2>
            <p className="text-[#555] text-[13px]">
              {step === "signing" &&
                ">Please approve the transaction in your Phantom wallet"}
              {step === "confirming" && ">This may take a few seconds..."}
            </p>
          </div>
        )}

        {/* ═══ SUCCESS ═══ */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#28c840]/10 flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-[#28c840]" />
            </div>
            <h2 className="text-[#ccc] text-2xl font-bold mb-2">
              &gt;Token Launched!
            </h2>
            <p className="text-[#555] text-[14px] mb-8">
              &gt;Your token has been successfully launched on Pump.fun
            </p>

            {txSignature && (
              <div className="bg-[#111] border border-[#222] rounded-lg px-4 py-3 mb-6 w-full max-w-md">
                <p className="text-[#555] text-[11px] mb-1">
                  &gt;Transaction:
                </p>
                <p className="text-[#ccc] text-[12px] break-all">
                  {txSignature}
                </p>
              </div>
            )}

            <div className="flex gap-3 w-full max-w-md">
              {txSignature && (
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-lg text-[14px] text-black bg-[#ccc] hover:bg-white flex items-center justify-center gap-2 transition-all"
                >
                  &gt;View on Solscan{" "}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => router.push(`/s/${slug}`)}
                className="flex-1 py-3 rounded-lg text-[14px] text-[#ccc] bg-[#1a1a1a] hover:bg-[#222] border border-[#222] flex items-center justify-center gap-2 transition-all"
              >
                &gt;View Website
              </button>
            </div>
          </div>
        )}

        {/* ═══ ERROR ═══ */}
        {step === "error" && !launching && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#ff5f57]/10 flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-[#ff5f57]" />
            </div>
            <h2 className="text-[#ccc] text-2xl font-bold mb-2">
              &gt;Launch Failed
            </h2>
            <p className="text-[#ff5f57] text-[13px] mb-8">
              &gt;{error}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep("form");
                  setError(null);
                }}
                className="px-8 py-3 rounded-lg text-[14px] text-black bg-[#ccc] hover:bg-white transition-all"
              >
                &gt;Try Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-8 py-3 rounded-lg text-[14px] text-[#ccc] bg-[#1a1a1a] hover:bg-[#222] border border-[#222] transition-all"
              >
                &gt;Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

