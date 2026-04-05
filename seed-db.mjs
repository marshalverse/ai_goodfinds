import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// Seed AI Tools
const aiTools = [
  { name: "ChatGPT", slug: "chatgpt", description: "OpenAI 開發的大型語言模型，擅長對話、寫作、程式碼生成等多種任務。", category: "llm", color: "#10a37f" },
  { name: "Claude", slug: "claude", description: "Anthropic 開發的 AI 助手，以安全性和深度分析能力著稱。", category: "llm", color: "#d4a574" },
  { name: "Gemini", slug: "gemini", description: "Google DeepMind 開發的多模態 AI 模型，整合搜尋與推理能力。", category: "llm", color: "#4285f4" },
  { name: "Midjourney", slug: "midjourney", description: "專注於藝術創作的 AI 圖像生成工具，以高品質美學風格聞名。", category: "image", color: "#0d1117" },
  { name: "Stable Diffusion", slug: "stable-diffusion", description: "開源的 AI 圖像生成模型，支援本地部署與高度客製化。", category: "image", color: "#a855f7" },
  { name: "DALL-E", slug: "dall-e", description: "OpenAI 開發的圖像生成模型，擅長根據文字描述創建圖像。", category: "image", color: "#ff6b35" },
  { name: "GitHub Copilot", slug: "github-copilot", description: "GitHub 與 OpenAI 合作開發的 AI 程式碼助手，支援多種程式語言。", category: "code", color: "#238636" },
  { name: "Cursor", slug: "cursor", description: "AI 驅動的程式碼編輯器，整合多種 LLM 提供智慧編碼體驗。", category: "code", color: "#7c3aed" },
  { name: "Suno", slug: "suno", description: "AI 音樂生成平台，可根據文字描述創作完整歌曲。", category: "audio", color: "#ec4899" },
  { name: "Runway", slug: "runway", description: "AI 影片生成與編輯工具，支援文字轉影片等多種創意功能。", category: "video", color: "#06b6d4" },
  { name: "Perplexity", slug: "perplexity", description: "AI 驅動的搜尋引擎，提供即時、有來源引用的答案。", category: "llm", color: "#20b2aa" },
  { name: "Grok", slug: "grok", description: "xAI 開發的大型語言模型，整合即時資訊與幽默風格。", category: "llm", color: "#1d9bf0" },
];

for (const tool of aiTools) {
  await conn.execute(
    "INSERT IGNORE INTO ai_tools (name, slug, description, category, color) VALUES (?, ?, ?, ?, ?)",
    [tool.name, tool.slug, tool.description, tool.category, tool.color]
  );
}
console.log(`Seeded ${aiTools.length} AI tools`);

// Seed Tags
const tagsList = [
  { name: "教學", slug: "tutorial", color: "#3b82f6" },
  { name: "案例分享", slug: "case-study", color: "#10b981" },
  { name: "問題求助", slug: "help", color: "#ef4444" },
  { name: "提示詞分享", slug: "prompt-sharing", color: "#f59e0b" },
  { name: "新手入門", slug: "beginner", color: "#8b5cf6" },
  { name: "進階技巧", slug: "advanced", color: "#ec4899" },
  { name: "工具比較", slug: "comparison", color: "#06b6d4" },
  { name: "最佳實踐", slug: "best-practice", color: "#14b8a6" },
  { name: "新功能", slug: "new-feature", color: "#f97316" },
  { name: "Bug 回報", slug: "bug-report", color: "#dc2626" },
  { name: "創意作品", slug: "creative-work", color: "#a855f7" },
  { name: "工作流程", slug: "workflow", color: "#64748b" },
];

for (const tag of tagsList) {
  await conn.execute(
    "INSERT IGNORE INTO tags (name, slug, color) VALUES (?, ?, ?)",
    [tag.name, tag.slug, tag.color]
  );
}
console.log(`Seeded ${tagsList.length} tags`);

await conn.end();
console.log("Seed complete!");
