import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, TrendingUp, Eye, Heart, MessageCircle, Users, FileText } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import PostCard from "@/components/PostCard";

const categoryLabels: Record<string, string> = {
  llm: "大型語言模型",
  image: "圖像生成",
  audio: "音訊生成",
  video: "影片生成",
  code: "程式碼助手",
  other: "其他工具",
};

const categoryIcons: Record<string, string> = {
  llm: "💬",
  image: "🎨",
  audio: "🎵",
  video: "🎬",
  code: "💻",
  other: "🔧",
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: tools } = trpc.tools.list.useQuery();
  const { data: trendingPosts } = trpc.posts.trending.useQuery({ limit: 6 });
  const { data: recentData } = trpc.posts.list.useQuery({ limit: 6, sortBy: "latest" });

  // Group tools by category
  const toolsByCategory = (tools || []).reduce<Record<string, NonNullable<typeof tools>>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category]!.push(tool);
    return acc;
  }, {});

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.637_0.237_311_/_8%)] via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[oklch(0.637_0.237_311_/_5%)] rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-[oklch(0.6_0.2_260_/_5%)] rounded-full blur-3xl" />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              探索 AI 的無限可能
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="gradient-text">AI好物誌</span>
              <br />
              <span className="text-foreground">AI GoodFinds</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              在這裡，您可以與全球 AI 愛好者交流使用經驗、分享提示詞技巧、
              <br className="hidden md:block" />
              探索各種 AI 工具的最佳實踐，並發現 AI 的無限潛力。
            </p>
            <div className="flex items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/create">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0 shadow-lg shadow-primary/25">
                    開始發表文章
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0 shadow-lg shadow-primary/25">
                    加入社群
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              )}
              <Link href="/guide">
                <Button variant="outline" size="lg" className="gap-2">
                  新手指南
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Categories */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">探索 AI 工具</h2>
            <p className="text-muted-foreground mt-1">選擇您感興趣的 AI 工具，加入討論</p>
          </div>
        </div>
        <div className="space-y-10">
          {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>{categoryIcons[category] || "🔧"}</span>
                {categoryLabels[category] || category}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(categoryTools || []).map((tool) => (
                  <Link key={tool.id} href={`/tools/${tool.slug}`}>
                    <Card className="group hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card border-border/50 h-full">
                      <CardContent className="p-4 text-center">
                        <div
                          className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110"
                          style={{ backgroundColor: tool.color || "#6366f1" }}
                        >
                          {tool.name[0]}
                        </div>
                        <h4 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors">{tool.name}</h4>
                        <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{tool.postCount}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tool.memberCount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Posts */}
      {trendingPosts && trendingPosts.length > 0 && (
        <section className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                熱門文章
              </h2>
              <p className="text-muted-foreground mt-1">社群中最受歡迎的討論</p>
            </div>
            <Link href="/trending">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                查看更多 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentData?.posts && recentData.posts.length > 0 && (
        <section className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">最新文章</h2>
              <p className="text-muted-foreground mt-1">社群中最新發表的內容</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentData.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
