import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// New AI Tools to add
const newTools = [
  { name: "Copilot", slug: "copilot", description: "Microsoft 開發的 AI 助手，整合於 Windows、Office 365 和 Edge 瀏覽器中，提供智慧生產力工具。", category: "llm", color: "#0078d4" },
  { name: "Manus", slug: "manus", description: "自主 AI 代理平台，能夠獨立完成複雜任務，包括研究、開發和數據分析。", category: "other", color: "#6366f1" },
  { name: "Sora", slug: "sora", description: "OpenAI 開發的文字轉影片 AI 模型，能根據文字描述生成逼真的影片內容。", category: "video", color: "#ff4500" },
  { name: "NotebookLM", slug: "notebooklm", description: "Google 開發的 AI 筆記助手，能分析上傳的文件並提供深度摘要與問答功能。", category: "llm", color: "#34a853" },
  { name: "DeepSeek", slug: "deepseek", description: "深度求索開發的大型語言模型，以強大的推理能力和開源策略著稱。", category: "llm", color: "#1a73e8" },
  { name: "Udio", slug: "udio", description: "AI 音樂生成平台，可根據文字描述創作多種風格的音樂作品。", category: "audio", color: "#ff6b6b" },
  { name: "Pika", slug: "pika", description: "AI 影片生成工具，支援文字轉影片和圖片轉影片等創意功能。", category: "video", color: "#ff9500" },
  { name: "Windsurf", slug: "windsurf", description: "AI 驅動的程式碼編輯器，提供智慧程式碼補全和 AI 對話式開發體驗。", category: "code", color: "#00bcd4" },
  { name: "Lovable", slug: "lovable", description: "AI 驅動的全端應用開發平台，透過自然語言描述即可生成完整的網頁應用。", category: "code", color: "#e91e63" },
  { name: "Bolt", slug: "bolt", description: "AI 驅動的網頁應用開發工具，支援即時預覽和一鍵部署。", category: "code", color: "#ff5722" },
  { name: "v0", slug: "v0", description: "Vercel 開發的 AI UI 生成工具，能根據描述生成 React 元件和網頁介面。", category: "code", color: "#000000" },
  { name: "其他", slug: "other", description: "其他未分類的 AI 工具討論，歡迎分享任何新興或小眾的 AI 工具。", category: "other", color: "#6b7280" },
];

for (const tool of newTools) {
  await conn.execute(
    "INSERT IGNORE INTO ai_tools (name, slug, description, category, color) VALUES (?, ?, ?, ?, ?)",
    [tool.name, tool.slug, tool.description, tool.category, tool.color]
  );
}
console.log(`Seeded ${newTools.length} new AI tools`);

await conn.end();
console.log("New tools seed complete!");
