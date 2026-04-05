import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function CreatePost() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const preselectedTool = params.get("tool");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [toolId, setToolId] = useState<string>(preselectedTool || "");
  const [postType, setPostType] = useState<string>("article");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [previewMode, setPreviewMode] = useState<string>("edit");

  const { data: tools } = trpc.tools.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();

  const createMutation = trpc.posts.create.useMutation({
    onSuccess: (data) => {
      toast.success("文章發表成功！");
      navigate(`/posts/${data.id}`);
    },
    onError: (err) => {
      toast.error("發表失敗：" + err.message);
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("請輸入標題"); return; }
    if (!content.trim()) { toast.error("請輸入內容"); return; }
    if (!toolId) { toast.error("請選擇 AI 工具"); return; }
    createMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      summary: summary.trim() || undefined,
      toolId: parseInt(toolId),
      postType: postType as any,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    });
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回
        </Button>
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-8">發表新文章</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">標題</Label>
            <Input
              id="title"
              placeholder="輸入文章標題..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-border/50 text-lg"
            />
          </div>

          {/* Summary */}
          <div>
            <Label htmlFor="summary" className="text-sm font-medium text-foreground mb-2 block">摘要 <span className="text-muted-foreground font-normal">（選填）</span></Label>
            <Input
              id="summary"
              placeholder="簡短描述文章內容..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="bg-secondary border-border/50"
            />
          </div>

          {/* Content Editor with Preview */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">內容 <span className="text-muted-foreground font-normal">（支援 Markdown 格式）</span></Label>
            <Tabs value={previewMode} onValueChange={setPreviewMode}>
              <TabsList className="bg-secondary mb-2">
                <TabsTrigger value="edit">編輯</TabsTrigger>
                <TabsTrigger value="preview" className="gap-1"><Eye className="w-3 h-3" /> 預覽</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <Textarea
                  placeholder="使用 Markdown 格式撰寫您的文章內容...&#10;&#10;## 標題&#10;&#10;正文內容...&#10;&#10;```python&#10;# 程式碼區塊&#10;```"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-secondary border-border/50 min-h-[400px] font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="min-h-[400px] p-4 bg-secondary rounded-lg border border-border/50">
                  {content ? (
                    <div className="prose-custom">
                      <Streamdown>{content}</Streamdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">尚無內容可預覽</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Tool Selection */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">AI 工具</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={toolId} onValueChange={setToolId}>
                <SelectTrigger className="bg-secondary border-border/50">
                  <SelectValue placeholder="選擇相關的 AI 工具" />
                </SelectTrigger>
                <SelectContent>
                  {(tools || []).map((tool) => (
                    <SelectItem key={tool.id} value={String(tool.id)}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: tool.color || "#6366f1" }} />
                        {tool.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Post Type */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">文章類型</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger className="bg-secondary border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">文章</SelectItem>
                  <SelectItem value="prompt">提示詞分享</SelectItem>
                  <SelectItem value="tutorial">教學</SelectItem>
                  <SelectItem value="question">問題求助</SelectItem>
                  <SelectItem value="comparison">工具比較</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">標籤</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(tags || []).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      selectedTags.includes(tag.id)
                        ? "bg-primary/20 text-primary border-primary/40"
                        : "hover:bg-secondary"
                    }`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            className="w-full gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0 shadow-lg shadow-primary/20"
            size="lg"
            disabled={createMutation.isPending}
            onClick={handleSubmit}
          >
            <Send className="w-4 h-4" />
            {createMutation.isPending ? "發表中..." : "發表文章"}
          </Button>
        </div>
      </div>
    </div>
  );
}
