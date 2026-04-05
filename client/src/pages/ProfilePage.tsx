import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, FileText, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import PostCard from "@/components/PostCard";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || "0");

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
    return <div className="container py-16 text-center"><p className="text-muted-foreground">找不到此用戶</p></div>;
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/20 shrink-0">
          {profile.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-1">{profile.name || "匿名用戶"}</h1>
          {profile.bio && <p className="text-muted-foreground leading-relaxed mb-3">{profile.bio}</p>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>加入於 {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true, locale: zhTW })}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 text-center">
            <FileText className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{profile.postCount}</div>
            <div className="text-xs text-muted-foreground">篇文章</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 text-center">
            <Heart className="w-5 h-5 text-rose-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{profile.totalLikes}</div>
            <div className="text-xs text-muted-foreground">獲得讚數</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 col-span-2 md:col-span-1">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{profile.preferredTools?.length || 0}</div>
            <div className="text-xs text-muted-foreground">擅長工具</div>
          </CardContent>
        </Card>
      </div>

      {/* Preferred Tools */}
      {profile.preferredTools && profile.preferredTools.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">擅長的 AI 工具</h2>
          <div className="flex flex-wrap gap-2">
            {profile.preferredTools.map((tool: any) => (
              <Badge key={tool.id} variant="outline" style={{ borderColor: `${tool.color}40`, color: tool.color || undefined }}>
                {tool.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* User Posts */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">發表的文章</h2>
        {profile.posts && profile.posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {profile.posts.map((post: any) => (
              <PostCard key={post.id} post={{ ...post, author: { id: profile.id, name: profile.name, avatarUrl: profile.avatarUrl } }} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">尚未發表任何文章</p>
        )}
      </div>
    </div>
  );
}
