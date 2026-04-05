import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Eye, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";

const postTypeLabels: Record<string, string> = {
  article: "文章",
  prompt: "提示詞",
  tutorial: "教學",
  question: "問題",
  comparison: "比較",
};

const postTypeColors: Record<string, string> = {
  article: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  prompt: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  tutorial: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  question: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  comparison: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};

interface PostCardProps {
  post: {
    id: number;
    title: string;
    summary?: string | null;
    content: string;
    postType: string;
    likeCount: number;
    commentCount: number;
    viewCount: number;
    bookmarkCount: number;
    createdAt: Date;
    author?: { id: number; name: string | null; avatarUrl?: string | null } | null;
    tool?: { id: number; name: string; slug: string; color: string | null } | null;
    tags?: { id: number; name: string; color: string | null }[];
  };
}

export default function PostCard({ post }: PostCardProps) {
  const excerpt = post.summary || post.content.slice(0, 120).replace(/[#*`\n]/g, "") + "...";

  return (
    <Link href={`/posts/${post.id}`}>
      <Card className="group h-full hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card border-border/50">
        <CardContent className="p-5">
          {/* Top: Tool badge + Post type */}
          <div className="flex items-center gap-2 mb-3">
            {post.tool && (
              <Badge variant="outline" className="text-xs font-medium border-border/60" style={{ borderColor: `${post.tool.color}40`, color: post.tool.color || undefined }}>
                {post.tool.name}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${postTypeColors[post.postType] || ""}`}>
              {postTypeLabels[post.postType] || post.postType}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {excerpt}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Bottom: Author + Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-xs text-white font-medium">
                {post.author?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-xs text-muted-foreground">{post.author?.name || "匿名用戶"}</span>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-muted-foreground/70">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: zhTW })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likeCount}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.commentCount}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
