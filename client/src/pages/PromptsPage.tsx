import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PenSquare, Search, Wand2, Copy, Heart, Eye, MessageCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";

export default function PromptsPage() {
  const { isAuthenticated } = useAuth();
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tools } = trpc.tools.list.useQuery();
  const { data: postsData, isLoading } = trpc.posts.list.useQuery({
    postType: "prompt",
    toolId: toolFilter !== "all" ? parseInt(toolFilter) : undefined,
    sortBy,
    search: searchQuery || undefined,
    limit: 50,
  });

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">提示詞庫</h1>
        </div>
        <p className="text-muted-foreground">探索和分享各種 AI 工具的精選提示詞，提升您的 AI 使用效率</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋提示詞..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border/50"
          />
        </div>
        <Select value={toolFilter} onValueChange={setToolFilter}>
          <SelectTrigger className="w-40 bg-secondary border-border/50">
            <SelectValue placeholder="所有工具" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有工具</SelectItem>
            {(tools || []).map((tool) => (
              <SelectItem key={tool.id} value={String(tool.id)}>{tool.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32 bg-secondary border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">最新</SelectItem>
            <SelectItem value="popular">最熱門</SelectItem>
            <SelectItem value="views">最多瀏覽</SelectItem>
          </SelectContent>
        </Select>
        {isAuthenticated ? (
          <Link href="/create?postType=prompt">
            <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white border-0">
              <PenSquare className="w-4 h-4" /> 分享提示詞
            </Button>
          </Link>
        ) : (
          <a href={getLoginUrl()}>
            <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white border-0">
              登入後分享
            </Button>
          </a>
        )}
      </div>

      {/* Prompts Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : postsData?.posts && postsData.posts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {postsData.posts.map((post) => (
            <PromptCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Wand2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">尚無提示詞</h3>
          <p className="text-muted-foreground mb-4">成為第一個分享提示詞的人！</p>
        </div>
      )}
    </div>
  );
}

function PromptCard({ post }: { post: any }) {
  const contentPreview = post.content.slice(0, 200).replace(/[#*`]/g, "");

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(post.content);
    toast.success("提示詞已複製到剪貼簿");
  };

  return (
    <Link href={`/posts/${post.id}`}>
      <Card className="group h-full hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 bg-card border-border/50">
        <CardContent className="p-5">
          {/* Top: Tool badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {post.tool && (
                <Badge variant="outline" className="text-xs" style={{ borderColor: `${post.tool.color}40`, color: post.tool.color || undefined }}>
                  {post.tool.name}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-card-foreground group-hover:text-amber-400 transition-colors line-clamp-1 mb-3">
            {post.title}
          </h3>

          {/* Prompt Preview */}
          <div className="bg-secondary/80 rounded-lg p-3 mb-4 border border-border/30">
            <p className="text-sm text-muted-foreground font-mono line-clamp-4 leading-relaxed">
              {contentPreview}
            </p>
          </div>

          {/* Bottom: Author + Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500/60 to-orange-500/30 flex items-center justify-center text-[10px] text-white font-medium">
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
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
