import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, TrendingUp, Users, FileText } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";

const categoryIcons: Record<string, string> = {
  llm: "💬",
  image: "🎨",
  audio: "🎵",
  video: "🎬",
  code: "💻",
  other: "🔧",
};

const categoryOrder = ["llm", "image", "audio", "video", "code", "other"];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { data: tools } = trpc.tools.list.useQuery();
  const { data: trendingPosts } = trpc.posts.trending.useQuery({ limit: 6 });
  const { data: recentData } = trpc.posts.list.useQuery({ limit: 6, sortBy: "latest" });

  // Group tools by category
  const toolsByCategory = (tools || []).reduce<Record<string, NonNullable<typeof tools>>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category]!.push(tool);
    return acc;
  }, {});

  const orderedCategories = categoryOrder.filter((cat) => toolsByCategory[cat]?.length);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.637_0.237_311_/_8%)] via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[oklch(0.637_0.237_311_/_5%)] rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-[oklch(0.6_0.2_260_/_5%)] rounded-full blur-3xl" />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-6">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663513894733/EMmCrr8wS6ruYCgz6zaGkz/logo_8b48a01d.png"
                alt="AI好物誌"
                className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-2xl shadow-2xl shadow-primary/30 ring-2 ring-primary/20"
              />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t("home.badge")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="gradient-text">{t("home.title1")}</span>
              <br />
              <span className="text-foreground">{t("home.title2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              {t("home.subtitle")}
            </p>
            <div className="flex items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/create">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0 shadow-lg shadow-primary/25">
                    {t("home.cta.create")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0 shadow-lg shadow-primary/25">
                    {t("home.cta.join")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              )}
              <Link href="/guide">
                <Button variant="outline" size="lg" className="gap-2">
                  {t("home.cta.guide")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      {recentData?.posts && recentData.posts.length > 0 && (
        <section className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t("home.recent")}</h2>
            </div>
            <Link href="/latest">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                {t("home.viewAll")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentData.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Posts */}
      {trendingPosts && trendingPosts.length > 0 && (
        <section className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                {t("home.trending")}
              </h2>
            </div>
            <Link href="/trending">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                {t("home.viewAll")} <ArrowRight className="w-4 h-4" />
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

      {/* AI Tools Categories */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t("home.explore")}</h2>
          </div>
        </div>
        <div className="space-y-10">
          {orderedCategories.map((category) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>{categoryIcons[category] || "🔧"}</span>
                {t(`sidebar.${category}`)}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(toolsByCategory[category] || []).map((tool) => (
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

      {/* Empty State */}
      {(!trendingPosts || trendingPosts.length === 0) && (!recentData?.posts || recentData.posts.length === 0) && (
        <section className="container py-16 text-center">
          <p className="text-muted-foreground text-lg">{t("home.noPosts")}</p>
        </section>
      )}
    </div>
  );
}
