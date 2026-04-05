import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Bookmark } from "lucide-react";
import { useEffect } from "react";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BookmarksPage() {
  const { isAuthenticated, loading } = useAuth();
  const { data: bookmarkedPosts, isLoading } = trpc.bookmarks.list.useQuery(undefined, { enabled: isAuthenticated });
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated) {
    return <div className="container py-16 text-center"><p className="text-muted-foreground">{language === "zh" ? "載入中..." : "Loading..."}</p></div>;
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t("nav.bookmarks")}</h1>
        </div>
        <p className="text-muted-foreground">{language === "zh" ? "您收藏的所有文章都在這裡" : "All your bookmarked articles are here"}</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : bookmarkedPosts && bookmarkedPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarkedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("search.noResults")}</h3>
        </div>
      )}
    </div>
  );
}
