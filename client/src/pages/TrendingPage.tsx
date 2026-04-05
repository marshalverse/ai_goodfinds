import { trpc } from "@/lib/trpc";
import { TrendingUp, Flame } from "lucide-react";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TrendingPage() {
  const { data: trendingPosts, isLoading } = trpc.posts.trending.useQuery({ limit: 30 });
  const { t } = useLanguage();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t("trending.title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("trending.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : trendingPosts && trendingPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingPosts.map((post, idx) => (
            <div key={post.id} className="relative">
              {idx < 3 && (
                <div className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  {idx + 1}
                </div>
              )}
              <PostCard post={post} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("search.noResults")}</h3>
        </div>
      )}
    </div>
  );
}
