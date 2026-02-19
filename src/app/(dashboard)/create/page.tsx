"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, ArrowLeft, Loader2, ExternalLink,
  Send, Copy, Check, X, FileCode, MessageSquare,
  FolderOpen, Github, ChevronRight, RefreshCw,
  Download, Wand2,
} from "lucide-react";
import { saveBotToServer } from "@/lib/browser-bots";

/* ── Templates ── */
const TEMPLATES = [
  { id: "blackjack", label: "Blackjack Game" },
  { id: "trivia", label: "Trivia Quiz" },
  { id: "storyteller", label: "Story Adventure" },
  { id: "study_assistant", label: "Study Assistant" },
  { id: "code_assistant", label: "Code Helper" },
  { id: "trading_analyst", label: "Trading Analyst" },
  { id: "fitness_coach", label: "Fitness Coach" },
  { id: "language_tutor", label: "Language Tutor" },
  { id: "recipe_chef", label: "Recipe Chef" },
  { id: "dungeon_master", label: "D&D Master" },
  { id: "debate_partner", label: "Debate Partner" },
];

interface BotFile {
  path: string;
  content: string;
}

type RightTab = "code" | "test";
type ModalState =
  | "none"
  | "github-auth"
  | "pushing"
  | "push-success"
  | "publish-name"
  | "publishing"
  | "publish-success";

export default function CreatePage() {
  const router = useRouter();
  const publicKey = null; // wallet removed

  /* ── Step 1: Describe ── */
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Live streaming preview ── */
  const [streamingCode, setStreamingCode] = useState("");
  const streamRef = useRef<HTMLPreElement>(null);

  /* ── Step 2: Code Review ── */
  const [botName, setBotName] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [suggestedSlug, setSuggestedSlug] = useState("");
  const [files, setFiles] = useState<BotFile[]>([]);
  const [selectedFile, setSelectedFile] = useState(0);
  const [editMode, setEditMode] = useState(false);

  /* ── Right panel ── */
  const [rightTab, setRightTab] = useState<RightTab>("code");

  /* ── Test chat ── */
  const [testMessages, setTestMessages] = useState<{ role: string; content: string }[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testStreaming, setTestStreaming] = useState(false);
  const testEndRef = useRef<HTMLDivElement>(null);

  /* ── GitHub ── */
  const [modal, setModal] = useState<ModalState>("none");
  const [repoName, setRepoName] = useState("");
  const [pushedRepoUrl, setPushedRepoUrl] = useState("");

  /* ── Publish (to webai) ── */
  const [publishSlug, setPublishSlug] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  /* ── Refine bot ── */
  const [refineInput, setRefineInput] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineHistory, setRefineHistory] = useState<{ instruction: string; summary: string }[]>([]);
  const refineInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testMessages]);

  function handleTemplateClick(id: string) {
    setSelectedTemplate(id === selectedTemplate ? null : id);
  }

  /* ════════════════════════════════
     GENERATE CODE (streaming)
     ════════════════════════════════ */
  async function streamGenerate() {
    setGenerating(true);
    setError(null);
    setStreamingCode("");
    setEditMode(false);

    try {
      const res = await fetch("/api/bots/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description || undefined,
          template: selectedTemplate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Generation failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let raw = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const d = line.slice(6);
              if (d === "[DONE]") break;
              try {
                const parsed = JSON.parse(d);

                if (parsed.chunk) {
                  raw += parsed.chunk;
                  setStreamingCode(raw);
                  // Auto-scroll the streaming preview
                  requestAnimationFrame(() => {
                    if (streamRef.current) {
                      streamRef.current.scrollTop = streamRef.current.scrollHeight;
                    }
                  });
                }

                if (parsed.done) {
                  setBotName(parsed.name || "");
                  setBotDescription(parsed.description || "");
                  setSystemPrompt(parsed.system_prompt || "");
                  setSuggestedSlug(parsed.suggested_slug || "");
                  setFiles(parsed.files || []);
                  setSelectedFile(0);
                  setRepoName(parsed.suggested_slug || "my-bot");
                  setPublishSlug(parsed.suggested_slug || "");
                  setEditMode(true);
                  setRightTab("code");
                  setTestMessages([]);
                }

                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                  // Only throw real errors, not JSON parse errors from partial data
                  if (e.message !== "Unexpected end of JSON input" && !e.message.includes("JSON")) {
                    throw e;
                  }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerate() {
    await streamGenerate();
  }

  async function handleRegenerate() {
    setFiles([]);
    setTestMessages([]);
    await streamGenerate();
  }

  /* ════════════════════════════════
     REFINE CODE (streaming)
     ════════════════════════════════ */
  async function handleRefine() {
    const instruction = refineInput.trim();
    if (!instruction || refining || files.length === 0) return;

    setRefining(true);
    setError(null);
    setStreamingCode("");
    setEditMode(false); // Show streaming preview

    const prevInstruction = instruction;
    setRefineInput("");

    try {
      const res = await fetch("/api/bots/refine-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files,
          instruction,
          botName,
          botDescription,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Refine failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let raw = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const d = line.slice(6);
              if (d === "[DONE]") break;
              try {
                const parsed = JSON.parse(d);

                if (parsed.chunk) {
                  raw += parsed.chunk;
                  setStreamingCode(raw);
                  requestAnimationFrame(() => {
                    if (streamRef.current) {
                      streamRef.current.scrollTop = streamRef.current.scrollHeight;
                    }
                  });
                }

                if (parsed.done) {
                  setBotName(parsed.name || botName);
                  setBotDescription(parsed.description || botDescription);
                  setSystemPrompt(parsed.system_prompt || systemPrompt);
                  if (parsed.suggested_slug) setSuggestedSlug(parsed.suggested_slug);
                  setFiles(parsed.files || files);
                  setSelectedFile(0);
                  setEditMode(true);
                  setRightTab("code");
                  setRefineHistory((prev) => [
                    ...prev,
                    { instruction: prevInstruction, summary: parsed.change_summary || "Changes applied" },
                  ]);
                }

                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                if (e instanceof Error && !e.message.includes("JSON")) {
                  throw e;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refine failed");
      setEditMode(true); // Restore edit mode on error
    } finally {
      setRefining(false);
    }
  }

  /* ════════════════════════════════
     TEST CHAT
     ════════════════════════════════ */
  async function handleTestSend() {
    const text = testInput.trim();
    if (!text || testStreaming) return;

    const userMsg = { role: "user", content: text };
    const newMsgs = [...testMessages, userMsg];
    setTestMessages([...newMsgs, { role: "assistant", content: "" }]);
    setTestInput("");
    setTestStreaming(true);

    try {
      const res = await fetch("/api/test-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, messages: newMsgs }),
      });

      if (!res.ok) throw new Error("Test chat failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const d = line.slice(6);
              if (d === "[DONE]") break;
              try {
                const parsed = JSON.parse(d);
                if (parsed.content) {
                  full += parsed.content;
                  setTestMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: full };
                    return updated;
                  });
                }
              } catch { /* skip */ }
            }
          }
        }
      }
    } catch {
      setTestMessages(newMsgs);
      setError("Test chat failed");
    } finally {
      setTestStreaming(false);
    }
  }

  /* ════════════════════════════════
     GITHUB PUSH
     ════════════════════════════════ */
  async function handleGithubPush() {
    if (!repoName.trim() || files.length === 0) return;
    setModal("pushing");
    setError(null);

    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: repoName.trim(),
          files,
          description: `${botName} — ${botDescription}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Push failed");

      setPushedRepoUrl(data.repoUrl);

      // Save to Supabase + localStorage for my_bots page
      saveBotToServer({
        name: botName || repoName,
        description: botDescription || "AI Bot generated by WebAI",
        type: "github",
        url: data.repoUrl,
        repoName: data.repoName,
      });

      setModal("push-success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Push failed");
      setModal("github-auth");
    }
  }

  /* ════════════════════════════════
     PUBLISH TO WEBAI
     ════════════════════════════════ */
  function handlePublishClick() {
    setPublishSlug(suggestedSlug || botName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    setModal("publish-name");
  }

  async function handlePublishConfirm() {
    if (!publishSlug.trim() || !systemPrompt) return;
    setModal("publishing");
    setError(null);

    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: publishSlug.trim(),
          name: botName,
          description: botDescription,
          systemPrompt,
          template: selectedTemplate || null,
          walletAddress: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");

      const url = `${window.location.origin}/b/${data.slug}`;
      setPublishedUrl(url);

      // Save to Supabase + localStorage for my_bots page
      saveBotToServer({
        name: botName,
        description: botDescription || "AI Bot published on WebAI",
        type: "webai",
        url,
        slug: data.slug,
      });

      setModal("publish-success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
      setModal("publish-name");
    }
  }

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFileEdit(newContent: string) {
    setFiles((prev) => {
      const updated = [...prev];
      updated[selectedFile] = { ...updated[selectedFile], content: newContent };
      return updated;
    });
  }

  function handleDownloadFile() {
    const file = files[selectedFile];
    if (!file) return;
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.path.split("/").pop() || "file.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function getFileIcon(_path: string) {
    return "▪";
  }

  /* Build a tree structure from flat file paths */
  function buildFileTree(flatFiles: BotFile[]) {
    interface TreeNode {
      name: string;
      path?: string; // full path for files
      fileIndex?: number;
      children: TreeNode[];
      isDir: boolean;
    }

    const root: TreeNode = { name: "root", children: [], isDir: true };

    flatFiles.forEach((file, idx) => {
      const parts = file.path.split("/");
      let current = root;

      parts.forEach((part, pi) => {
        const isFile = pi === parts.length - 1;
        let child = current.children.find((c) => c.name === part && c.isDir === !isFile);

        if (!child) {
          child = {
            name: part,
            children: [],
            isDir: !isFile,
            ...(isFile ? { path: file.path, fileIndex: idx } : {}),
          };
          current.children.push(child);
        }
        current = child;
      });
    });

    // Sort: dirs first, then files alphabetically
    function sortTree(node: TreeNode) {
      node.children.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortTree);
    }
    sortTree(root);

    return root.children;
  }

  function renderTreeNodes(nodes: ReturnType<typeof buildFileTree>, depth = 0) {
    return nodes.map((node) => {
      if (node.isDir) {
        return (
          <div key={node.name + depth}>
            <div
              className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-[#888]"
              style={{ paddingLeft: `${8 + depth * 14}px` }}
            >
              <FolderOpen className="w-3 h-3 text-[#febc2e]" />
              <span>{node.name}/</span>
            </div>
            {renderTreeNodes(node.children, depth + 1)}
          </div>
        );
      }

      const idx = node.fileIndex!;
      return (
        <button
          key={node.path}
          onClick={() => { setSelectedFile(idx); setRightTab("code"); }}
          className={`w-full text-left py-1.5 text-[12px] flex items-center gap-1.5 transition-all ${
            selectedFile === idx
              ? "bg-[#1a1a1a] text-[#ccc]"
              : "text-[#666] hover:text-[#ccc] hover:bg-[#111]"
          }`}
          style={{ paddingLeft: `${8 + depth * 14}px`, paddingRight: "8px" }}
        >
          <span className="text-[10px]">{getFileIcon(node.path!)}</span>
          <span className="truncate">{node.name}</span>
          {selectedFile === idx && <ChevronRight className="w-3 h-3 ml-auto text-[#555]" />}
        </button>
      );
    });
  }

  /* ══════════════════════════════════
     RENDER
     ══════════════════════════════════ */
  return (
    <div className="min-h-screen bg-black p-4 relative">
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-32px)]">

        {/* ═══════ LEFT PANEL ═══════ */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-2 font-mono">

          {editMode ? (
            <>
              {/* Header */}
              <div className="p-2">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 text-[#666] hover:text-[#ccc] text-[13px] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> &gt;main menu
                  </button>
                  <span className="text-[#333]">|</span>
                  <button
                    onClick={() => { setEditMode(false); setFiles([]); setTestMessages([]); }}
                    className="text-[#666] hover:text-[#ccc] text-[13px] transition-colors"
                  >
                    &gt;new bot
                  </button>
                </div>

                <h2 className="text-[#ccc] text-lg font-bold mb-1">
                  &gt;{botName || "Your Bot"}
                </h2>
                <p className="text-[#555] text-[12px]">
                  &gt;{botDescription}
                </p>
                <p className="text-[#444] text-[11px] mt-1">{files.length} files generated</p>
              </div>

              {/* Bot Name Edit */}
              <div className="p-2">
                <label className="text-[#888] text-[12px] block mb-1.5 font-bold">&gt;Bot Name</label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full bg-[#111] rounded-lg px-3 py-2 text-[13px] text-[#ccc] placeholder-[#333] focus:outline-none"
                />
              </div>

              {/* File Tree */}
              <div className="p-2">
                <label className="text-[#888] text-[12px] block mb-2 font-bold flex items-center gap-1.5">
                  <FolderOpen className="w-3 h-3" /> &gt;Project Files
                  <span className="text-[#444] font-normal ml-auto">{files.length} files</span>
                </label>
                <div className="bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] overflow-hidden max-h-[320px] overflow-y-auto">
                  {renderTreeNodes(buildFileTree(files))}
                </div>
              </div>

              {error && (
                <div className="p-2 text-[#ff5f57] text-[12px]">&gt;Error: {error}</div>
              )}

              {/* ── Refine Bot ── */}
              <div className="p-2">
                <label className="text-[#888] text-[12px] block mb-2 font-bold flex items-center gap-1.5">
                  <Wand2 className="w-3 h-3" /> &gt;Edit Bot
                </label>

                {/* Refine history */}
                {refineHistory.length > 0 && (
                  <div className="mb-2 max-h-[120px] overflow-y-auto space-y-1.5">
                    {refineHistory.map((entry, i) => (
                      <div key={i} className="bg-[#0a0a0a] rounded-lg px-2.5 py-2 border border-[#1a1a1a]">
                        <p className="text-[#666] text-[11px] truncate">&gt; {entry.instruction}</p>
                        <p className="text-[#28c840] text-[10px] mt-0.5">✓ {entry.summary}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Refine input */}
                <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] px-3 py-2">
                  <span className="text-[#28c840] text-[12px] shrink-0">&gt;</span>
                  <input
                    ref={refineInputRef}
                    type="text"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRefine()}
                    placeholder="Add leaderboard, change theme..."
                    disabled={refining || generating}
                    className="flex-1 bg-transparent text-[#ccc] text-[12px] placeholder-[#444] focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleRefine}
                    disabled={refining || generating || !refineInput.trim()}
                    className="w-6 h-6 rounded-md bg-[#222] hover:bg-[#333] flex items-center justify-center text-[#888] hover:text-[#ccc] transition-all disabled:opacity-30"
                  >
                    {refining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-[#333] text-[10px] mt-1.5">
                  &gt;Describe changes and AI will update the code
                </p>
              </div>

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={handleRegenerate}
                  disabled={generating || refining}
                  className="w-full px-3 py-2 rounded-lg text-[12px] text-[#888] bg-[#111] hover:bg-[#1a1a1a] border border-[#222] flex items-center justify-center gap-1.5 transition-all disabled:opacity-30"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  &gt;Regenerate from Scratch
                </button>
              </div>

              {/* Push & Publish buttons */}
              <div className="p-2 mt-auto space-y-2">
                <button
                  onClick={() => setModal("github-auth")}
                  disabled={files.length === 0}
                  className="w-full py-3 rounded-lg font-bold text-[14px] text-black bg-[#ccc] hover:bg-white flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Github className="w-4 h-4" /> &gt;Deploy to GitHub
                </button>
                <button
                  onClick={handlePublishClick}
                  disabled={!systemPrompt.trim() || !botName.trim()}
                  className="w-full py-2.5 rounded-lg text-[13px] text-[#888] hover:text-[#ccc] bg-[#111] hover:bg-[#1a1a1a] border border-[#222] flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> &gt;Publish on WebAI
                </button>
              </div>
            </>
          ) : (
            /* ═══ CREATE MODE ═══ */
            <>
              <div className="p-2">
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center gap-2 text-[#666] hover:text-[#ccc] text-[13px] mb-4 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> &gt;main menu
                </button>
                <h2 className="text-[#ccc] text-lg font-bold mb-1">
                  &gt;Create Your AI Bot
                </h2>
                <p className="text-[#555] text-[12px] mb-4">
                  &gt;Describe any bot — game, assistant, tool, anything
                </p>

                <textarea
                  className="w-full bg-[#111] rounded-lg p-3 text-[13px] text-[#ccc] placeholder-[#444] resize-none focus:outline-none"
                  rows={5}
                  placeholder={'What should your bot do?\n\nExamples:\n• "A blackjack card game"\n• "A study helper that quizzes me"\n• "A recipe bot that suggests meals"'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="mt-4">
                  <span className="text-[#666] text-[12px]">&gt;Or pick a template:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleTemplateClick(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${
                          selectedTemplate === t.id
                            ? "bg-[#ccc]/15 text-[#ccc]"
                            : "bg-[#111] text-[#666] hover:text-white"
                        }`}
                      >
                        &gt;{t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mt-4 text-[#ff5f57] text-[13px]">&gt;Error: {error}</div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={generating || (!description && !selectedTemplate)}
                  className="mt-5 w-full py-3 rounded-lg font-bold text-[15px] text-black bg-[#ccc] hover:bg-white flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> &gt;Generating...</>
                  ) : (
                    <>&gt;Generate Bot <Sparkles className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ═══════ RIGHT PANEL ═══════ */}
        <div className="rounded-lg overflow-hidden bg-[#0d0d0d] flex flex-col">
          {/* Title bar */}
          <div className="h-[38px] bg-[#1a1a1a] flex items-center px-3 gap-3 shrink-0">
            <div className="flex items-center gap-[6px]">
              <div className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
            </div>

            {editMode ? (
              <div className="flex-1 flex items-center justify-center gap-1">
                <button
                  onClick={() => setRightTab("code")}
                  className={`px-3 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                    rightTab === "code" ? "bg-[#222] text-[#ccc]" : "text-[#555] hover:text-[#ccc]"
                  }`}
                >
                  <FileCode className="w-3 h-3" /> Code
                </button>
                <button
                  onClick={() => setRightTab("test")}
                  className={`px-3 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                    rightTab === "test" ? "bg-[#222] text-[#ccc]" : "text-[#555] hover:text-[#ccc]"
                  }`}
                >
                  <MessageSquare className="w-3 h-3" /> Test Bot
                </button>
              </div>
            ) : (
              <div className="flex-1 text-center">
                <span className="text-[12px] font-mono text-[#666]">preview</span>
              </div>
            )}

            {editMode && rightTab === "code" && files[selectedFile] && (
              <button onClick={handleDownloadFile} className="text-[#555] hover:text-[#ccc] transition-colors" title="Download file">
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {editMode && rightTab === "code" ? (
            /* ═══ CODE VIEW ═══ */
            <div className="flex-1 flex flex-col overflow-hidden">
              {files[selectedFile] && (
                <div className="bg-[#111] border-b border-[#1a1a1a] px-4 py-2 flex items-center gap-2 text-[12px] text-[#888] font-mono shrink-0">
                  <span>{getFileIcon(files[selectedFile].path)}</span>
                  <span>{files[selectedFile].path}</span>
                  <span className="ml-auto text-[#444] text-[10px]">
                    {files[selectedFile].content.split("\n").length} lines
                  </span>
                </div>
              )}

              <div className="flex-1 overflow-auto">
                {files[selectedFile] ? (
                  <div className="flex min-h-full">
                    <div className="bg-[#0a0a0a] text-[#333] text-[12px] font-mono py-3 px-2 text-right select-none shrink-0 leading-[20px] min-w-[45px]">
                      {files[selectedFile].content.split("\n").map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <textarea
                      value={files[selectedFile].content}
                      onChange={(e) => handleFileEdit(e.target.value)}
                      className="flex-1 bg-transparent text-[#ccc] text-[12px] font-mono py-3 px-4 leading-[20px] resize-none focus:outline-none"
                      spellCheck={false}
                      style={{ tabSize: 2 }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-[#555] text-[13px] font-mono">
                    &gt;Select a file from the tree
                  </div>
                )}
              </div>
            </div>
          ) : editMode && rightTab === "test" ? (
            /* ═══ TEST CHAT ═══ */
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 font-mono">
                {testMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 rounded-xl bg-[#111] border border-[#222] flex items-center justify-center text-[#ccc] text-[20px] mb-3">
                      &gt;
                    </div>
                    <p className="text-[#555] text-[14px] mb-1">{botName || "Your Bot"}</p>
                    <p className="text-[#444] text-[12px]">&gt;Send a message to test its behavior</p>
                    <p className="text-[#333] text-[11px] mt-2">&gt;Uses the system prompt from your bot&apos;s code</p>
                  </div>
                )}

                {testMessages.map((msg, i) => (
                  <div key={i} className="mb-3">
                    {msg.role === "user" ? (
                      <div className="flex items-start gap-2">
                        <span className="text-[#28c840] text-[12px] shrink-0 mt-0.5">you$</span>
                        <p className="text-[#ccc] text-[13px] whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 mt-1">
                        <span className="text-[#888] text-[12px] shrink-0 mt-0.5">bot:</span>
                        <div className="text-[#bbb] text-[13px] whitespace-pre-wrap leading-relaxed min-h-[16px]">
                          {msg.content || (
                            <span className="text-[#555] inline-flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> thinking...
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={testEndRef} />
              </div>

              <div className="border-t border-[#1a1a1a] px-4 py-3 flex items-center gap-3">
                <span className="text-[#28c840] font-mono text-[13px] shrink-0">&gt;</span>
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTestSend()}
                  placeholder="Test your bot..."
                  disabled={testStreaming}
                  className="flex-1 bg-transparent text-[#ccc] font-mono text-[13px] placeholder-[#444] focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleTestSend}
                  disabled={testStreaming || !testInput.trim()}
                  className="w-7 h-7 rounded-lg bg-[#222] hover:bg-[#333] flex items-center justify-center text-[#888] hover:text-[#ccc] transition-all disabled:opacity-30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* ═══ EMPTY STATE / STREAMING PREVIEW ═══ */
            <div className="flex-1 flex flex-col overflow-hidden">
              {(generating || refining) && streamingCode ? (
                /* ── Live code streaming ── */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Streaming header */}
                  <div className="bg-[#111] border-b border-[#1a1a1a] px-4 py-2 flex items-center gap-2 text-[12px] font-mono shrink-0">
                    <Loader2 className="w-3 h-3 animate-spin text-[#28c840]" />
                    <span className="text-[#28c840]">&gt;{refining ? "AI is editing your bot..." : "AI is writing code..."}</span>
                    <span className="ml-auto text-[#333] text-[10px]">
                      {streamingCode.length.toLocaleString()} chars
                    </span>
                  </div>

                  {/* Code stream view */}
                  <pre
                    ref={streamRef}
                    className="flex-1 overflow-auto p-4 text-[12px] font-mono leading-[20px] text-[#8b8b8b] whitespace-pre-wrap break-words select-text"
                    style={{
                      background: "linear-gradient(180deg, #0a0a0a 0%, #050505 100%)",
                    }}
                  >
                    {/* Highlight code-like content within the streaming JSON */}
                    {streamingCode.split("\n").map((line, i) => {
                      // Colorize lines that look like code
                      const isKey = /^\s*"(name|description|path|content|system_prompt|suggested_slug|files)"/.test(line);
                      const isCodeContent = !isKey && !line.trim().startsWith("{") && !line.trim().startsWith("}") && !line.trim().startsWith("[") && !line.trim().startsWith("]");
                      const isPython = line.includes("def ") || line.includes("class ") || line.includes("import ") || line.includes("from ") || line.includes("self.");
                      const isHtml = line.includes("<") && line.includes(">");
                      const isComment = line.trim().startsWith("#") || line.trim().startsWith("//");

                      let color = "#555";
                      if (isKey) color = "#888";
                      else if (isComment) color = "#444";
                      else if (isPython) color = "#8bb8e8";
                      else if (isHtml) color = "#e8a87c";
                      else if (isCodeContent) color = "#9a9a9a";

                      return (
                        <span key={i} style={{ color }}>
                          {line}
                          {"\n"}
                        </span>
                      );
                    })}
                    <span className="inline-block w-[7px] h-[14px] bg-[#28c840] animate-pulse ml-[1px]" />
                  </pre>
                </div>
              ) : (generating || refining) ? (
                /* ── Initial generating/refining state (before any stream data) ── */
                <div className="flex-1 flex flex-col items-center justify-center p-8 font-mono">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-6 h-6 border-2 border-[#333] border-t-[#28c840] rounded-full animate-spin" />
                    <p className="text-[#666] text-[14px]">&gt;{refining ? "Applying changes..." : "Connecting to AI..."}</p>
                    <p className="text-[#444] text-[11px]">&gt;{refining ? "Updating your bot code" : "Preparing code generation"}</p>
                  </div>
                </div>
              ) : (
                /* ── Default empty state ── */
                <div className="flex-1 flex flex-col items-center justify-center p-8 font-mono">
                  <div className="w-16 h-16 rounded-xl bg-[#111] border border-[#222] flex items-center justify-center mb-4">
                    <FileCode className="w-7 h-7 text-[#444]" />
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">&gt;Create Any AI Bot</h3>
                  <p className="text-[#666] text-[13px] text-center max-w-[320px] leading-relaxed mb-6">
                    &gt;Describe what your bot should do and we&apos;ll write the entire source code for you.
                  </p>
                  <div className="bg-[#111] rounded-lg px-4 py-3 max-w-[340px] space-y-2">
                    <p className="text-[#555] text-[12px] flex items-center gap-2">
                      <span className="text-[#28c840]">1.</span> AI writes real, deployable code
                    </p>
                    <p className="text-[#555] text-[12px] flex items-center gap-2">
                      <span className="text-[#febc2e]">2.</span> Test the bot&apos;s behavior live
                    </p>
                    <p className="text-[#555] text-[12px] flex items-center gap-2">
                      <span className="text-[#ff5f57]">3.</span> Push to GitHub or publish on WebAI
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════
          MODALS
         ═══════════════════════════════ */}
      {modal !== "none" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm font-mono">

          {/* GitHub Auth */}
          {modal === "github-auth" && (
            <div className="bg-[#111] border border-[#222] rounded-lg w-[460px] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#ccc] text-xl font-bold flex items-center gap-2">
                  <Github className="w-5 h-5" /> &gt;Deploy to GitHub
                </h2>
                <button onClick={() => { setModal("none"); setError(null); }} className="text-[#555] hover:text-[#ccc] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[#555] text-[12px] mb-5">&gt;Your bot will be pushed to github.com/webaibot as a public repository</p>

              <div className="space-y-4">
                <div>
                  <label className="text-[#888] text-[12px] block mb-1.5">&gt;Repository Name</label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGithubPush()}
                    placeholder="my-ai-bot"
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2.5 text-[13px] text-[#ccc] placeholder-[#333] focus:outline-none focus:border-[#555] transition-colors"
                    autoFocus
                  />
                  <p className="text-[#444] text-[10px] mt-1.5">
                    &gt;github.com/webaibot/{repoName.trim().toLowerCase().replace(/[^a-z0-9-_.]/g, "-").replace(/-+/g, "-") || "your-bot"}
                  </p>
                </div>

                {error && <p className="text-[#ff5f57] text-[12px]">&gt;{error}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleGithubPush}
                  disabled={!repoName.trim()}
                  className="flex-1 py-3 rounded-lg font-bold text-[14px] text-black bg-[#ccc] hover:bg-white flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Github className="w-4 h-4" /> &gt;Deploy
                </button>
                <button
                  onClick={() => { setModal("none"); setError(null); }}
                  className="px-6 py-3 rounded-lg text-[14px] text-[#888] bg-[#1a1a1a] hover:bg-[#222] border border-[#333] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Pushing */}
          {modal === "pushing" && (
            <div className="bg-[#111] border border-[#222] rounded-lg w-[420px] p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#333] border-t-[#ccc] rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-[#ccc] text-lg font-bold mb-2">&gt;Pushing to GitHub...</h2>
              <p className="text-[#555] text-[12px]">&gt;Creating repo and uploading {files.length} files</p>
            </div>
          )}

          {/* Push Success */}
          {modal === "push-success" && (
            <div className="bg-[#111] border border-[#222] rounded-lg w-[460px] p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#28c840]/10 border border-[#28c840]/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-[#28c840]" />
                </div>
                <h2 className="text-[#ccc] text-2xl font-bold mb-2">&gt;Pushed!</h2>
                <p className="text-[#666] text-[13px]">&gt;Your bot code is on GitHub</p>
              </div>

              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 mb-6">
                <p className="text-[#555] text-[11px] mb-1">&gt;Repository:</p>
                <p className="text-[#ccc] text-[14px] break-all">{pushedRepoUrl}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.open(pushedRepoUrl, "_blank")}
                  className="w-full py-3 rounded-lg font-bold text-[14px] text-black bg-[#ccc] hover:bg-white flex items-center justify-center gap-2 transition-all"
                >
                  <Github className="w-4 h-4" /> &gt;Open Repository <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setModal("none")}
                  className="w-full py-2.5 rounded-lg text-[13px] text-[#666] hover:text-[#ccc] bg-[#1a1a1a] hover:bg-[#222] border border-[#222] transition-all"
                >
                  &gt;Close
                </button>
              </div>
            </div>
          )}

          {/* Publish Name */}
          {modal === "publish-name" && (
            <div className="bg-[#111] border border-[#222] rounded-lg w-[420px] p-6">
              <h2 className="text-[#ccc] text-xl font-bold mb-1">&gt;Publish on WebAI</h2>
              <p className="text-[#555] text-[12px] mb-6">&gt;Your bot will be live for anyone to chat with</p>

              <label className="text-[#666] text-[12px] block mb-2">&gt;Bot URL:</label>
              <input
                type="text"
                value={publishSlug}
                onChange={(e) => setPublishSlug(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePublishConfirm()}
                placeholder="my-bot"
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-[14px] text-[#ccc] placeholder-[#333] focus:outline-none focus:border-[#555] transition-colors"
                autoFocus
              />
              <p className="text-[#444] text-[11px] mt-2">
                &gt;webai.com/b/{publishSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") || "your-bot"}
              </p>

              {error && <p className="text-[#ff5f57] text-[12px] mt-3">&gt;{error}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handlePublishConfirm}
                  disabled={!publishSlug.trim()}
                  className="flex-1 py-3 rounded-lg font-bold text-[14px] text-black bg-[#ccc] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  &gt;Publish
                </button>
                <button
                  onClick={() => { setModal("none"); setError(null); }}
                  className="px-6 py-3 rounded-lg text-[14px] text-[#888] bg-[#1a1a1a] hover:bg-[#222] border border-[#333] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Publishing */}
          {modal === "publishing" && (
            <div className="bg-[#111] border border-[#222] rounded-lg w-[420px] p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#333] border-t-[#ccc] rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-[#ccc] text-lg font-bold mb-2">&gt;Publishing...</h2>
              <p className="text-[#555] text-[12px]">&gt;Making your bot live</p>
            </div>
          )}

          {/* Publish Success */}
          {modal === "publish-success" && (
            <div className="bg-[#111] border border-[#222] rounded-lg w-[420px] p-6">
              <div className="text-center mb-6">
                <h2 className="text-[#ccc] text-2xl font-bold mb-2">&gt;Live!</h2>
                <p className="text-[#666] text-[13px]">&gt;Your bot is published and ready</p>
              </div>

              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 mb-6">
                <p className="text-[#555] text-[11px] mb-1">&gt;Bot URL:</p>
                <div className="flex items-center justify-between">
                  <p className="text-[#ccc] text-[14px] break-all">{publishedUrl}</p>
                  <button onClick={handleCopyUrl} className="ml-2 shrink-0 text-[#666] hover:text-[#ccc] transition-colors">
                    {copied ? <Check className="w-4 h-4 text-[#28c840]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.open(publishedUrl, "_blank")}
                  className="w-full py-3 rounded-lg font-bold text-[14px] text-black bg-[#ccc] hover:bg-white flex items-center justify-center gap-2 transition-all"
                >
                  &gt;Open Bot <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setModal("none")}
                  className="w-full py-2.5 rounded-lg text-[13px] text-[#666] hover:text-[#ccc] bg-[#1a1a1a] hover:bg-[#222] border border-[#222] transition-all"
                >
                  &gt;Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
