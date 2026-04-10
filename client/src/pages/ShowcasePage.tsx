import { trpc } from "@/lib/trpc";
import { Palette, Sparkles } from "lucide-react";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo } from "react";

export default function ShowcasePage() {
  const { data: tags } = trpc.tags.list.useQuery();
  const { t, language } = useLanguage();

  // Find the "創意作品" tag ID
  const showcaseTagId = useMemo(() => {
    if (!tags) return undefined;
    const tag = tags.find(t => t.name === "創意作品" || t.name?.toLowerCase() === "creative works" || t.name?.toLowerCase() === "showcase");
    return tag?.id;
  }, [tags]);

  const { data: results, isLoading } = trpc.posts.list.useQuery(
    { tagId: showcaseTagId, sortBy: "latest", limit: 30 },
    { enabled: !!showcaseTagId }
  );

  const isLoadingAll = isLoading || !tags;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t("nav.showcase")}</h1>
        </div>
        <p className="text-muted-foreground">{t("showcase.subtitle")}</p>
      </div>

      {isLoadingAll ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : results?.posts && results.posts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("search.noResults")}</h3>
          <p className="text-muted-foreground">{language === "zh" ? "還沒有創意作品，快來分享你的作品吧！" : "No creative works yet. Be the first to share!"}</p>
        </div>
      )}
    </div>
  );
}
