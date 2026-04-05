import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GitCompare, PenSquare, ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ComparePage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { data: tools } = trpc.tools.list.useQuery();
  const { data: postsData, isLoading } = trpc.posts.list.useQuery({
    postType: "comparison",
    sortBy: "popular",
    limit: 20,
  });

  const toolPairs = (tools || []).slice(0, 6).flatMap((a, i) =>
    (tools || []).slice(i + 1, i + 3).map(b => ({ a, b }))
  ).slice(0, 6);

  return (
    <div className="container py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t("compare.title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("compare.subtitle")}</p>
        </div>
        {isAuthenticated ? (
          <Link href="/create?postType=comparison">
            <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white border-0">
              <PenSquare className="w-4 h-4" /> {t("nav.createPost")}
            </Button>
          </Link>
        ) : (
          <a href={getLoginUrl()}>
            <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white border-0">
              {t("nav.login")}
            </Button>
          </a>
        )}
      </div>

      {toolPairs.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("compare.selectTools")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {toolPairs.map(({ a, b }, idx) => (
              <Link key={idx} href={`/search?type=comparison&q=${a.name}+vs+${b.name}`}>
                <Card className="group hover:border-cyan-500/30 transition-all duration-300 bg-card border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: a.color || "#6366f1" }}>
                      {a.name[0]}
                    </div>
                    <span className="text-muted-foreground font-medium text-sm">VS</span>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: b.color || "#6366f1" }}>
                      {b.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground group-hover:text-cyan-400 transition-colors">
                        {a.name} vs {b.name}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("compare.discussions")}</h2>
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : postsData?.posts && postsData.posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {postsData.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <GitCompare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t("search.noResults")}</h3>
          </div>
        )}
      </div>
    </div>
  );
}
