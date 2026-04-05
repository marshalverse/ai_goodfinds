import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const guideContent: Record<string, {
  zh: { title: string; intro: string; sections: { heading: string; content: string }[]; tips: string[] };
  en: { title: string; intro: string; sections: { heading: string; content: string }[]; tips: string[] };
}> = {
  chatgpt: {
    zh: {
      title: "ChatGPT 新手指南",
      intro: "ChatGPT 是由 OpenAI 開發的大型語言模型，能夠理解和生成自然語言文字。它可以幫助您撰寫文章、回答問題、翻譯語言、撰寫程式碼等。",
      sections: [
        { heading: "什麼是 ChatGPT？", content: "ChatGPT 是一個基於 GPT 架構的對話式 AI，能夠進行多輪對話，理解上下文，並提供有用的回應。它支援多種語言，包括中文、英文、日文等。" },
        { heading: "如何開始使用？", content: "訪問 chat.openai.com 註冊帳號即可開始使用。免費版提供 GPT-3.5 模型，付費版（Plus）可使用 GPT-4 等更強大的模型。" },
        { heading: "撰寫有效的提示詞", content: "好的提示詞應該具體、清晰，並提供足夠的上下文。例如，與其說「寫一篇文章」，不如說「請以專業的語氣，撰寫一篇 500 字關於人工智慧在醫療領域應用的文章」。" },
      ],
      tips: ["使用角色扮演讓 ChatGPT 以特定身份回答", "提供範例讓 AI 理解您期望的輸出格式", "使用分步驟指令處理複雜任務", "善用系統提示詞設定對話基調"],
    },
    en: {
      title: "ChatGPT Beginner's Guide",
      intro: "ChatGPT is a large language model developed by OpenAI that can understand and generate natural language text. It can help you write articles, answer questions, translate languages, and write code.",
      sections: [
        { heading: "What is ChatGPT?", content: "ChatGPT is a conversational AI based on the GPT architecture, capable of multi-turn dialogue, understanding context, and providing useful responses. It supports multiple languages including Chinese, English, and Japanese." },
        { heading: "How to Get Started?", content: "Visit chat.openai.com to register an account. The free version provides GPT-3.5, while the paid version (Plus) gives access to GPT-4 and more powerful models." },
        { heading: "Writing Effective Prompts", content: "Good prompts should be specific, clear, and provide sufficient context. For example, instead of saying 'write an article', say 'please write a 500-word article about AI applications in healthcare in a professional tone'." },
      ],
      tips: ["Use role-playing to have ChatGPT respond as a specific persona", "Provide examples so AI understands your expected output format", "Use step-by-step instructions for complex tasks", "Leverage system prompts to set the conversation tone"],
    },
  },
  claude: {
    zh: {
      title: "Claude 新手指南",
      intro: "Claude 是由 Anthropic 開發的 AI 助手，以安全性和有用性著稱。它擅長長文分析、程式碼撰寫和創意寫作。",
      sections: [
        { heading: "什麼是 Claude？", content: "Claude 是一個注重安全和誠實的 AI 助手，能夠處理長達 200K tokens 的上下文，非常適合分析長文件和進行深度對話。" },
        { heading: "Claude 的優勢", content: "Claude 在長文理解、程式碼分析、創意寫作方面表現出色。它的回應通常更加謹慎和準確，適合需要高品質輸出的場景。" },
        { heading: "最佳使用場景", content: "文件分析與摘要、程式碼審查與除錯、學術研究輔助、創意寫作與編輯。" },
      ],
      tips: ["利用長上下文窗口上傳完整文件進行分析", "Claude 擅長遵循複雜指令，可以給出詳細的格式要求", "使用 XML 標籤結構化您的提示詞", "善用 Artifacts 功能生成可互動的內容"],
    },
    en: {
      title: "Claude Beginner's Guide",
      intro: "Claude is an AI assistant developed by Anthropic, known for its safety and helpfulness. It excels at long document analysis, code writing, and creative writing.",
      sections: [
        { heading: "What is Claude?", content: "Claude is a safety-focused AI assistant that can handle up to 200K tokens of context, making it ideal for analyzing long documents and deep conversations." },
        { heading: "Claude's Advantages", content: "Claude excels in long-text comprehension, code analysis, and creative writing. Its responses are typically more careful and accurate, suitable for scenarios requiring high-quality output." },
        { heading: "Best Use Cases", content: "Document analysis and summarization, code review and debugging, academic research assistance, creative writing and editing." },
      ],
      tips: ["Leverage the long context window to upload complete documents for analysis", "Claude excels at following complex instructions - provide detailed format requirements", "Use XML tags to structure your prompts", "Take advantage of Artifacts for interactive content generation"],
    },
  },
  midjourney: {
    zh: {
      title: "Midjourney 新手指南",
      intro: "Midjourney 是一款強大的 AI 圖像生成工具，能夠根據文字描述創造出令人驚嘆的藝術作品和圖像。",
      sections: [
        { heading: "什麼是 Midjourney？", content: "Midjourney 是一個 AI 圖像生成平台，透過 Discord 或網頁介面使用。只需輸入文字描述，即可生成高品質的圖像。" },
        { heading: "基本指令", content: "使用 /imagine 指令加上您的描述即可生成圖像。例如：/imagine a beautiful sunset over mountains, oil painting style" },
        { heading: "提升圖像品質", content: "使用參數如 --ar（寬高比）、--v（版本）、--q（品質）來控制輸出。例如：--ar 16:9 --v 6 --q 2" },
      ],
      tips: ["描述越具體，生成的圖像越符合預期", "參考藝術風格和藝術家名稱來引導風格", "使用負面提示詞排除不想要的元素", "善用 Vary 和 Upscale 功能微調結果"],
    },
    en: {
      title: "Midjourney Beginner's Guide",
      intro: "Midjourney is a powerful AI image generation tool that creates stunning artwork and images from text descriptions.",
      sections: [
        { heading: "What is Midjourney?", content: "Midjourney is an AI image generation platform used through Discord or web interface. Simply enter a text description to generate high-quality images." },
        { heading: "Basic Commands", content: "Use the /imagine command followed by your description to generate images. Example: /imagine a beautiful sunset over mountains, oil painting style" },
        { heading: "Improving Image Quality", content: "Use parameters like --ar (aspect ratio), --v (version), --q (quality) to control output. Example: --ar 16:9 --v 6 --q 2" },
      ],
      tips: ["The more specific your description, the closer the result matches expectations", "Reference art styles and artist names to guide the style", "Use negative prompts to exclude unwanted elements", "Use Vary and Upscale features to fine-tune results"],
    },
  },
  "stable-diffusion": {
    zh: {
      title: "Stable Diffusion 新手指南",
      intro: "Stable Diffusion 是一個開源的圖像生成模型，可以在本地運行，提供高度自定義的圖像生成體驗。",
      sections: [
        { heading: "什麼是 Stable Diffusion？", content: "Stable Diffusion 是由 Stability AI 開發的開源圖像生成模型。與其他 AI 繪圖工具不同，它可以在您自己的電腦上運行，完全免費且高度可自定義。" },
        { heading: "如何安裝？", content: "推薦使用 Automatic1111 WebUI 或 ComfyUI 作為介面。需要一張至少 6GB VRAM 的顯示卡。也可以使用 Google Colab 等雲端服務。" },
        { heading: "模型與 LoRA", content: "社群提供了大量的自定義模型和 LoRA（Low-Rank Adaptation），可以在 Civitai 等平台下載，實現各種特定風格的圖像生成。" },
      ],
      tips: ["從 Civitai 下載適合的模型和 LoRA", "學習使用 ControlNet 精確控制圖像構圖", "善用 img2img 功能在現有圖像基礎上修改", "調整 CFG Scale 和 Steps 找到品質與速度的平衡"],
    },
    en: {
      title: "Stable Diffusion Beginner's Guide",
      intro: "Stable Diffusion is an open-source image generation model that runs locally, providing a highly customizable image generation experience.",
      sections: [
        { heading: "What is Stable Diffusion?", content: "Stable Diffusion is an open-source image generation model developed by Stability AI. Unlike other AI art tools, it can run on your own computer, completely free and highly customizable." },
        { heading: "How to Install?", content: "We recommend using Automatic1111 WebUI or ComfyUI as the interface. You need a GPU with at least 6GB VRAM. You can also use cloud services like Google Colab." },
        { heading: "Models and LoRA", content: "The community provides numerous custom models and LoRAs (Low-Rank Adaptation) available on platforms like Civitai, enabling various specific style image generation." },
      ],
      tips: ["Download suitable models and LoRAs from Civitai", "Learn to use ControlNet for precise composition control", "Use img2img to modify existing images", "Adjust CFG Scale and Steps to balance quality and speed"],
    },
  },
};

export default function GuidePage() {
  const { slug } = useParams<{ slug?: string }>();
  const { data: tools } = trpc.tools.list.useQuery();
  const { t, language } = useLanguage();

  if (slug && guideContent[slug]) {
    const guide = guideContent[slug][language];
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Link href="/guide">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-6">
            ← {t("common.back")}
          </Button>
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-3">{guide.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{guide.intro}</p>
        </div>
        <div className="space-y-8">
          {guide.sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-xl font-semibold text-foreground mb-3">{section.heading}</h2>
              <p className="text-foreground/80 leading-relaxed">{section.content}</p>
            </div>
          ))}
          <div className="bg-secondary/50 rounded-xl p-6 border border-border/30">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> {language === "zh" ? "實用技巧" : "Practical Tips"}
            </h2>
            <ul className="space-y-2">
              {guide.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/80">
                  <span className="text-primary mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t("guide.title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("guide.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(tools || []).map((tool) => {
          const hasGuide = !!guideContent[tool.slug];
          return (
            <Card key={tool.id} className={`group border-border/50 bg-card ${hasGuide ? "hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5" : "opacity-60"} transition-all duration-300`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: tool.color || "#6366f1" }}
                  >
                    {tool.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground mb-1">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{tool.description}</p>
                    {hasGuide ? (
                      <Link href={`/guide/${tool.slug}`}>
                        <Button variant="ghost" size="sm" className="gap-2 text-emerald-400 hover:text-emerald-300 p-0 h-auto">
                          {t("guide.getStarted")} <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("common.comingSoon")}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
