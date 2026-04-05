import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, FileText, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || "0");
  const { t, language } = useLanguage();

  const { data: profile, isLoading } = trpc.profile.get.useQuery({ userId }, { enabled: userId > 0 });

  if (isLoading) {
    return (
      <div className="container py-16 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-muted" />
            <div className="space-y-3"><div className="h-6 w-40 bg-muted rounded" /><div className="h-4 w-60 bg-muted rounded" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="container py-16 text-center"><p className="text-muted-foreground">{language === "zh" ? "找不到此用戶" : "User not found"}</p></div>;
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/20 shrink-0">
          {profile.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-1">{profile.name || (language === "zh" ? "匿名用戶" : "Anonymous")}</h1>
          {profile.bio && <p className="text-muted-foreground leading-relaxed mb-3">{profile.bio}</p>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{language === "zh" ? "加入於" : "Joined"} {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true, locale: language === "zh" ? zhTW : undefined })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 text-center">
            <FileText className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{profile.postCount}</div>
            <div className="text-xs text-muted-foreground">{t("profile.posts")}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 text-center">
            <Heart className="w-5 h-5 text-rose-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{profile.totalLikes}</div>
            <div className="text-xs text-muted-foreground">{t("profile.likes")}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 col-span-2 md:col-span-1">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{profile.preferredTools?.length || 0}</div>
            <div className="text-xs text-muted-foreground">{t("profile.tools")}</div>
          </CardContent>
        </Card>
      </div>

      {profile.preferredTools && profile.preferredTools.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">{t("profile.preferredTools")}</h2>
          <div className="flex flex-wrap gap-2">
            {profile.preferredTools.map((tool: any) => (
              <Badge key={tool.id} variant="outline" style={{ borderColor: `${tool.color}40`, color: tool.color || undefined }}>
                {tool.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("profile.publishedPosts")}</h2>
        {profile.posts && profile.posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {profile.posts.map((post: any) => (
              <PostCard key={post.id} post={{ ...post, author: { id: profile.id, name: profile.name, avatarUrl: profile.avatarUrl } }} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">{t("search.noResults")}</p>
        )}
      </div>
    </div>
  );
}
