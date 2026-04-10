import { trpc } from "@/lib/trpc";
import { Clock, Sparkles } from "lucide-react";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LatestPage() {
  const { data: results, isLoading } = trpc.posts.list.useQuery({ sortBy: "latest", limit: 30 });
  const { t } = useLanguage();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t("nav.latest")}</h1>
        </div>
        <p className="text-muted-foreground">{t("latest.subtitle")}</p>
      </div>

      {isLoading ? (
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
        </div>
      )}
    </div>
  );
}
