import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PenSquare, Users, FileText, ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import PostCard from "@/components/PostCard";
import { useState, useMemo } from "react";

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [postType, setPostType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("latest");

  const { data: tool, isLoading: toolLoading } = trpc.tools.getBySlug.useQuery({ slug: slug || "" });
  const { data: postsData, isLoading: postsLoading } = trpc.posts.list.useQuery({
    toolId: tool?.id,
    postType: postType === "all" ? undefined : postType,
    sortBy,
    limit: 30,
  }, { enabled: !!tool?.id });

  if (toolLoading) {
    return (
      <div className="container py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">找不到此工具</p>
        <Link href="/"><Button variant="ghost" className="mt-4">返回首頁</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Back button */}
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回首頁
        </Button>
      </Link>

      {/* Tool Header */}
      <div className="flex items-start gap-5 mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0"
          style={{ backgroundColor: tool.color || "#6366f1" }}
        >
          {tool.name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
            <Badge variant="outline" className="text-xs">{tool.category.toUpperCase()}</Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed">{tool.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{tool.postCount} 篇文章</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{tool.memberCount} 位成員</span>
          </div>
        </div>
        <div>
          {isAuthenticated ? (
            <Link href={`/create?tool=${tool.id}`}>
              <Button className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0">
                <PenSquare className="w-4 h-4" /> 發表文章
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0">
                登入後發表
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Tabs value={postType} onValueChange={setPostType}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="article">文章</TabsTrigger>
            <TabsTrigger value="prompt">提示詞</TabsTrigger>
            <TabsTrigger value="tutorial">教學</TabsTrigger>
            <TabsTrigger value="question">問題</TabsTrigger>
            <TabsTrigger value="comparison">比較</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32 bg-secondary border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">最新</SelectItem>
            <SelectItem value="popular">最多讚</SelectItem>
            <SelectItem value="views">最多瀏覽</SelectItem>
            <SelectItem value="comments">最多評論</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Grid */}
      {postsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : postsData?.posts && postsData.posts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {postsData.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">尚無文章</h3>
          <p className="text-muted-foreground mb-4">成為第一個在 {tool.name} 討論區發表文章的人！</p>
          {isAuthenticated && (
            <Link href={`/create?tool=${tool.id}`}>
              <Button className="gap-2">
                <PenSquare className="w-4 h-4" /> 發表第一篇文章
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
