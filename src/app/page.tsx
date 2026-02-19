"use client";

import { useState, useEffect } from "react";

export default function HomePage() {
  const [typed, setTyped] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const command = ">webai";

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < command.length) {
          setTyped(command.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setFadeOut(true), 600);
          setTimeout(() => setLoaded(true), 1400);
        }
      }, 180);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  if (loaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8 animate-fadeIn">
        <div className="w-full max-w-[900px] rounded-lg overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
          {/* macOS title bar */}
          <div className="h-[28px] bg-[#3a3a3c] flex items-center px-3 relative">
            <div className="flex items-center gap-[6px]">
              <div className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[#9a9a9a] text-[12px]">webai — -zsh — 80×24</span>
            </div>
          </div>

          {/* Terminal body */}
          <div className="bg-[#1a1a1a] font-mono text-[22px] leading-[38px] p-8 select-text min-h-[420px]">
            <div className="text-[#c8c8c8]">Last login: {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} {new Date().toLocaleTimeString("en-US", { hour12: false })} on ttys000</div>
            <div className="text-[#c8c8c8] mt-[2px]">
              <span className="text-[#c8c8c8]">webai@launchpad ~ % </span>
            </div>

            <div className="mt-4 flex flex-col gap-[2px]">
              <MenuItem text=">create" href="/create" />
              <MenuItem text=">all_bots" href="/all-bots" />
              <MenuItem text=">my_bots" href="/my-sites" />
              <button
                onClick={() => setShowHowItWorks(true)}
                className="text-[#28c840] cursor-pointer hover:text-white transition-colors duration-100 block text-left text-[22px] leading-[38px] font-mono"
              >
                &gt;how_it_works
              </button>
              <MenuItem text=">github" href="https://github.com/webaibot" external />
              <MenuItem text=">x" href="https://x.com" external />
            </div>

            <div className="mt-6 text-[#666] text-[16px]">
              &gt;ca: 7QwBqtBJ5ZdFFSnk9H113w3jYQwtaFgxYaf4asHkpump
            </div>

            <div className="mt-2 flex items-center">
              <span className="text-[#c8c8c8]">webai@launchpad ~ % </span>
              <span className="text-[#c8c8c8] ml-[1px]" style={{ opacity: showCursor ? 1 : 0 }}>▋</span>
            </div>
          </div>
        </div>

        {/* ═══ HOW IT WORKS MODAL ═══ */}
        {showHowItWorks && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowHowItWorks(false)}
          >
            <div
              className="w-full max-w-[520px] rounded-lg overflow-hidden animate-fadeIn"
              style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.9)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title bar */}
              <div className="h-[28px] bg-[#3a3a3c] flex items-center px-3 relative">
                <div className="flex items-center gap-[6px]">
                  <button
                    onClick={() => setShowHowItWorks(false)}
                    className="w-[11px] h-[11px] rounded-full bg-[#ff5f57] hover:brightness-110 transition"
                  />
                  <div className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
                  <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[#9a9a9a] text-[11px]">webai — how_it_works</span>
                </div>
              </div>

              {/* Body */}
              <div className="bg-[#1a1a1a] font-mono p-6">
                <h2 className="text-[#ccc] text-[18px] font-bold mb-1">
                  &gt;Create Any AI Bot — Real Code
                </h2>
                <p className="text-[#555] text-[12px] mb-6">
                  &gt;Games, assistants, tools — describe it, we code it.
                </p>

                {/* Steps */}
                <div className="mb-6">
                  <p className="text-[#888] text-[13px] mb-3 font-bold">&gt;how_it_works:</p>
                  <div className="space-y-2.5 pl-2">
                    <Step n="1" text="Describe your bot (game, assistant, tool — anything)" accent="#28c840" />
                    <Step n="2" text="AI writes the full source code for your bot" accent="#febc2e" />
                    <Step n="3" text="Review code, test the bot live, edit if needed" accent="#ff5f57" />
                    <Step n="4" text="Publish on WebAI or push to GitHub" accent="#ccc" />
                  </div>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <FeatureCard
                    icon="<>"
                    title="Real Code"
                    desc="Full source code — app.py, Dockerfile, README, configs."
                  />
                  <FeatureCard
                    icon="⇪"
                    title="GitHub Push"
                    desc="One-click push to your GitHub. Clone and deploy anywhere."
                  />
                  <FeatureCard
                    icon="∞"
                    title="Any Bot Idea"
                    desc="Games, tutors, assistants, tools — if you can describe it, we build it."
                  />
                  <FeatureCard
                    icon="◉"
                    title="Test Before Ship"
                    desc="Chat with your bot live before publishing or pushing code."
                  />
                </div>

                {/* CTA */}
                <a
                  href="/create"
                  className="block w-full py-3 rounded-lg text-center text-black bg-[#ccc] hover:bg-white text-[14px] font-bold transition-all"
                >
                  &gt;Start Building Your Bot
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-black flex items-center justify-center transition-opacity duration-700"
      style={{ opacity: fadeOut ? 0 : 1 }}
    >
      <div className="flex items-center font-mono">
        <span className="text-white text-4xl md:text-5xl font-light tracking-wide">
          {typed}
        </span>
        <span
          className="text-white text-4xl md:text-5xl ml-[2px]"
          style={{ opacity: showCursor ? 1 : 0 }}
        >
          ▌
        </span>
      </div>
    </div>
  );
}

function MenuItem({ text, href, external }: { text: string; href: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="text-[#28c840] cursor-pointer hover:text-white transition-colors duration-100 block"
    >
      {text}
    </a>
  );
}

function Step({ n, text, accent }: { n: string; text: string; accent: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-[22px] h-[22px] rounded flex items-center justify-center text-[11px] font-bold shrink-0"
        style={{ background: `${accent}20`, color: accent }}
      >
        {n}
      </div>
      <span className="text-[#bbb] text-[13px]">{text}</span>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-lg p-4 hover:border-[#444] transition-all">
      <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#ccc] text-[14px] font-bold mb-3">
        {icon}
      </div>
      <h3 className="text-[#ccc] text-[13px] font-bold mb-1">&gt;{title}</h3>
      <p className="text-[#555] text-[11px] leading-relaxed">{desc}</p>
    </div>
  );
}
