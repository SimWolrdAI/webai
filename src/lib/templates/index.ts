export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  previewColors: {
    primary: string;
    secondary: string;
    bg: string;
  };
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean gradients, bold typography, glass-morphism effects",
    previewColors: { primary: "#6366f1", secondary: "#8b5cf6", bg: "#0f0f23" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Emerald tones, minimal layout, focus on content",
    previewColors: { primary: "#10b981", secondary: "#34d399", bg: "#111827" },
  },
  {
    id: "neon",
    name: "Neon",
    description: "Hot pink & orange neon glow, dark background, bold energy",
    previewColors: { primary: "#f43f5e", secondary: "#fb923c", bg: "#0a0a0a" },
  },
];

