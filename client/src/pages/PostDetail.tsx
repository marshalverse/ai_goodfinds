import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Bookmark, Eye, ArrowLeft, Share2, Send, Pencil } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id || "0");
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState("");
  const utils = trpc.useUtils();
  const { t, language } = useLanguage();

  const postTypeLabels: Record<string, string> = {
    article: t("create.type.article"),
    prompt: t("create.type.prompt"),
    tutorial: t("create.type.tutorial"),
    question: t("create.type.question"),
    comparison: t("create.type.comparison"),
  };

  const { data: post, isLoading } = trpc.posts.getById.useQuery({ id: postId }, { enabled: postId > 0 });
  const { data: comments } = trpc.comments.getByPostId.useQuery({ postId }, { enabled: postId > 0 });
  const { data: likedPosts } = trpc.likes.userLikedPosts.useQuery(undefined, { enabled: isAuthenticated });
  const { data: bookmarkedPosts } = trpc.bookmarks.userBookmarkedPosts.useQuery(undefined, { enabled: isAuthenticated });

  const isLiked = useMemo(() => (likedPosts || []).includes(postId), [likedPosts, postId]);
  const isBookmarked = useMemo(() => (bookmarkedPosts || []).includes(postId), [bookmarkedPosts, postId]);

  const likeMutation = trpc.likes.toggle.useMutation({
    onSuccess: () => { utils.posts.getById.invalidate({ id: postId }); utils.likes.userLikedPosts.invalidate(); },
  });
  const bookmarkMutation = trpc.bookmarks.toggle.useMutation({
    onSuccess: () => { utils.posts.getById.invalidate({ id: postId }); utils.bookmarks.userBookmarkedPosts.invalidate(); },
  });
  const commentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.comments.getByPostId.invalidate({ postId });
      utils.posts.getById.invalidate({ id: postId });
      toast.success(language === "zh" ? "評論已發表" : "Comment posted");
    },
  });

  if (isLoading) {
    return (
      <div className="container py-16 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-10 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-muted rounded" />)}</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground text-lg">{language === "zh" ? "找不到此文章" : "Post not found"}</p>
        <Link href="/"><Button variant="ghost" className="mt-4">{t("common.back")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Link href={post.tool ? `/tools/${post.tool.slug}` : "/"}>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t("common.back")}
        </Button>
      </Link>

      <article>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {post.tools && post.tools.length > 0 ? (
            post.tools.map((tool: any) => (
              <Badge key={tool.id} variant="outline" style={{ borderColor: `${tool.color}40`, color: tool.color || undefined }}>
                {tool.name}
              </Badge>
            ))
          ) : post.tool ? (
            <Badge variant="outline" style={{ borderColor: `${post.tool.color}40`, color: post.tool.color || undefined }}>
              {post.tool.name}
            </Badge>
          ) : null}
          <Badge variant="outline">{postTypeLabels[post.postType] || post.postType}</Badge>
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{post.title}</h1>
          {isAuthenticated && user?.id === post.authorId && (
            <Link href={`/create?edit=${post.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0 text-muted-foreground hover:text-foreground">
                <Pencil className="w-3.5 h-3.5" /> {t("common.edit")}
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <Link href={`/profile/${post.author?.id}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
            {post.author?.avatarUrl ? (
              <img src={post.author.avatarUrl} alt={post.author.name || "Avatar"} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-xs text-white font-medium">
                {post.author?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <span className="font-medium">{post.author?.name || (language === "zh" ? "匿名用戶" : "Anonymous")}</span>
          </Link>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: language === "zh" ? zhTW : undefined })}</span>
          <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.viewCount}</span>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span key={tag.id} className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="prose-custom mb-8" dangerouslySetInnerHTML={{ __html: post.content }} />

        <div className="flex items-center gap-3 py-4 border-t border-b border-border/50 mb-8">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${isLiked ? "text-rose-400 hover:text-rose-300" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => {
              if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
              likeMutation.mutate({ postId });
            }}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            {post.likeCount} {language === "zh" ? "讚" : "Likes"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${isBookmarked ? "text-amber-400 hover:text-amber-300" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => {
              if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
              bookmarkMutation.mutate({ postId });
            }}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
            {post.bookmarkCount} {t("nav.bookmarks")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success(language === "zh" ? "連結已複製" : "Link copied");
            }}
          >
            <Share2 className="w-4 h-4" /> {language === "zh" ? "分享" : "Share"}
          </Button>
          <span className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
            <MessageCircle className="w-4 h-4" /> {post.commentCount} {language === "zh" ? "則評論" : "comments"}
          </span>
        </div>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-6">{language === "zh" ? "評論" : "Comments"}</h2>

          {isAuthenticated ? (
            <div className="mb-8">
              <Textarea
                placeholder={language === "zh" ? "分享您的想法..." : "Share your thoughts..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-secondary border-border/50 min-h-[100px] mb-3"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0"
                  disabled={!commentText.trim() || commentMutation.isPending}
                  onClick={() => commentMutation.mutate({ postId, content: commentText.trim() })}
                >
                  <Send className="w-4 h-4" /> {language === "zh" ? "發表評論" : "Post Comment"}
                </Button>
              </div>
            </div>
          ) : (
            <Card className="mb-8 bg-secondary/50 border-border/30">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-3">{language === "zh" ? "登入後即可參與討論" : "Login to join the discussion"}</p>
                <a href={getLoginUrl()}><Button size="sm">{t("nav.login")}</Button></a>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {(comments || []).map((comment) => (
              <Card key={comment.id} className="bg-card border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Link href={`/profile/${comment.author?.id}`}>
                      {comment.author?.avatarUrl ? (
                        <img src={comment.author.avatarUrl} alt={comment.author.name || "Avatar"} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-xs text-white font-medium">
                          {comment.author?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </Link>
                    <span className="text-sm font-medium text-foreground">{comment.author?.name || (language === "zh" ? "匿名用戶" : "Anonymous")}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: language === "zh" ? zhTW : undefined })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                </CardContent>
              </Card>
            ))}
            {(!comments || comments.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                {language === "zh" ? "尚無評論，成為第一個留言的人吧！" : "No comments yet. Be the first to comment!"}
              </p>
            )}
          </div>
        </section>
      </article>
    </div>
  );
}
