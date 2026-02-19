"use client";

import React from "react";
import type { SiteSection, SiteTheme } from "@/lib/validation/schemas";

interface TokenInfo {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  website?: string | null;
  twitter?: string | null;
  telegram?: string | null;
}

interface SiteRendererProps {
  templateId: string;
  theme: SiteTheme;
  sections: SiteSection[];
  seo: { title?: string; description?: string };
  token: TokenInfo;
}

export function SiteRenderer({
  theme,
  sections,
  token,
}: SiteRendererProps) {
  const enabledSections = sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div
      style={{
        background: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily ?? "Inter, system-ui, sans-serif",
        minHeight: "100vh",
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          borderBottom: `1px solid ${theme.primaryColor}33`,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {token.name}
        </span>
        <div style={{ display: "flex", gap: "16px", fontSize: "0.9rem" }}>
          {token.twitter && (
            <a
              href={
                token.twitter.startsWith("http")
                  ? token.twitter
                  : `https://twitter.com/${token.twitter.replace("@", "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.primaryColor }}
            >
              Twitter
            </a>
          )}
          {token.telegram && (
            <a
              href={
                token.telegram.startsWith("http")
                  ? token.telegram
                  : `https://t.me/${token.telegram}`
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.primaryColor }}
            >
              Telegram
            </a>
          )}
          {token.website && (
            <a
              href={token.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.primaryColor }}
            >
              Website
            </a>
          )}
        </div>
      </nav>

      {/* Sections */}
      {enabledSections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          theme={theme}
          token={token}
        />
      ))}

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${theme.primaryColor}22`,
          padding: "24px",
          textAlign: "center",
          fontSize: "0.85rem",
          opacity: 0.5,
        }}
      >
        {token.name} &copy; {new Date().getFullYear()} &middot; Powered by AI
        Launchpad
      </footer>
    </div>
  );
}

function SectionBlock({
  section,
  theme,
  token,
}: {
  section: SiteSection;
  theme: SiteTheme;
  token: TokenInfo;
}) {
  const sectionStyle: React.CSSProperties = {
    padding: "80px 24px",
    maxWidth: "900px",
    margin: "0 auto",
  };

  if (section.type === "hero") {
    return (
      <section
        style={{
          ...sectionStyle,
          textAlign: "center",
          paddingTop: "120px",
          paddingBottom: "120px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: "9999px",
            background: `${theme.primaryColor}15`,
            border: `1px solid ${theme.primaryColor}30`,
            color: theme.primaryColor,
            fontSize: "0.85rem",
            marginBottom: "24px",
          }}
        >
          ${token.symbol}
        </div>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "24px",
          }}
        >
          {section.title}
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            opacity: 0.7,
            maxWidth: "600px",
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          {section.content}
        </p>
        <a
          href="https://pump.fun"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            color: "white",
            padding: "16px 40px",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "1.1rem",
            textDecoration: "none",
            transition: "opacity 0.2s",
          }}
        >
          Buy on Pump.fun
        </a>
      </section>
    );
  }

  if (section.type === "tokenomics") {
    return (
      <section style={sectionStyle}>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "32px",
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {section.title}
        </h2>
        <div
          style={{
            background: `${theme.primaryColor}08`,
            border: `1px solid ${theme.primaryColor}20`,
            borderRadius: "16px",
            padding: "32px",
          }}
        >
          {section.content.split("\n").map((line, i) => (
            <p
              key={i}
              style={{
                marginBottom: "12px",
                opacity: 0.85,
                lineHeight: 1.7,
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "roadmap") {
    const phases = section.content.split("\n").filter(Boolean);
    return (
      <section style={sectionStyle}>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "32px",
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {section.title}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {phases.map((phase, i) => (
            <div
              key={i}
              style={{
                background: `${theme.primaryColor}08`,
                border: `1px solid ${theme.primaryColor}20`,
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  color: theme.primaryColor,
                  fontWeight: 700,
                  marginBottom: "8px",
                  fontSize: "0.85rem",
                }}
              >
                Phase {i + 1}
              </div>
              <p style={{ opacity: 0.8, fontSize: "0.95rem", lineHeight: 1.5 }}>
                {phase.replace(/^Phase \d+:\s*/i, "")}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "faq") {
    const items: { q: string; a: string }[] = [];
    const lines = section.content.split("\n").filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("Q:")) {
        items.push({
          q: lines[i].replace("Q: ", ""),
          a: lines[i + 1]?.replace("A: ", "") ?? "",
        });
      }
    }
    return (
      <section style={sectionStyle}>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "32px",
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {section.title}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                background: `${theme.primaryColor}08`,
                border: `1px solid ${theme.primaryColor}20`,
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                {item.q}
              </div>
              <p style={{ opacity: 0.7, lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Default: about, socials, or any other section
  return (
    <section style={sectionStyle}>
      <h2
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          marginBottom: "24px",
          background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {section.title}
      </h2>
      {section.content.split("\n").map((line, i) => (
        <p
          key={i}
          style={{ marginBottom: "16px", opacity: 0.8, lineHeight: 1.7 }}
        >
          {line}
        </p>
      ))}
    </section>
  );
}

