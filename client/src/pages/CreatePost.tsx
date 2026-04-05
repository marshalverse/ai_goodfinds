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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, Eye, Globe } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function CreatePost() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const preselectedTool = params.get("tool");
  const preselectedType = params.get("postType");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedToolIds, setSelectedToolIds] = useState<number[]>(
    preselectedTool ? [parseInt(preselectedTool)] : []
  );
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [postType, setPostType] = useState<string>(preselectedType || "article");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [previewMode, setPreviewMode] = useState<string>("edit");

  const { data: tools } = trpc.tools.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();

  const allToolIds = useMemo(() => (tools || []).map(t => t.id), [tools]);

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

  const handleToggleAll = () => {
    if (isAllSelected) {
      setIsAllSelected(false);
      setSelectedToolIds([]);
    } else {
      setIsAllSelected(true);
      setSelectedToolIds([...allToolIds]);
    }
  };

  const handleToggleTool = (toolId: number) => {
    setSelectedToolIds((prev) => {
      let next: number[];
      if (prev.includes(toolId)) {
        next = prev.filter((id) => id !== toolId);
      } else {
        next = [...prev, toolId];
      }
      // Check if all tools are now selected
      setIsAllSelected(next.length === allToolIds.length && allToolIds.length > 0);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("請輸入標題"); return; }
    if (!content.trim()) { toast.error("請輸入內容"); return; }
    if (selectedToolIds.length === 0) { toast.error("請至少選擇一個 AI 工具"); return; }
    createMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      summary: summary.trim() || undefined,
      toolId: selectedToolIds[0],
      toolIds: selectedToolIds,
      postType: postType as any,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    });
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Group tools by category for display
  const toolsByCategory = useMemo(() => {
    return (tools || []).reduce<Record<string, typeof tools>>((acc, tool) => {
      const cat = tool.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat]!.push(tool);
      return acc;
    }, {});
  }, [tools]);

  const categoryLabels: Record<string, string> = {
    llm: "大型語言模型",
    image: "圖像生成",
    audio: "音訊生成",
    video: "影片生成",
    code: "程式開發",
    other: "其他",
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
                  placeholder={"使用 Markdown 格式撰寫您的文章內容...\n\n## 標題\n\n正文內容...\n\n```python\n# 程式碼區塊\n```"}
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
          {/* Tool Selection - Multi-select with ALL */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">AI 工具 <span className="text-muted-foreground font-normal">（可複選）</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* ALL option */}
              <div
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                  isAllSelected
                    ? "bg-primary/10 border-primary/40"
                    : "bg-secondary/50 border-border/30 hover:border-border/60"
                }`}
                onClick={handleToggleAll}
              >
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleToggleAll}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">ALL（所有工具）</span>
              </div>

              {/* Tool list by category */}
              <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                {Object.entries(toolsByCategory).map(([category, catTools]) => (
                  <div key={category}>
                    <p className="text-xs text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">
                      {categoryLabels[category] || category}
                    </p>
                    <div className="space-y-1">
                      {(catTools || []).map((tool) => (
                        <div
                          key={tool.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
                            selectedToolIds.includes(tool.id)
                              ? "bg-primary/10 border-primary/30"
                              : "bg-transparent border-transparent hover:bg-secondary/50"
                          }`}
                          onClick={() => handleToggleTool(tool.id)}
                        >
                          <Checkbox
                            checked={selectedToolIds.includes(tool.id)}
                            onCheckedChange={() => handleToggleTool(tool.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: tool.color || "#6366f1" }}
                          />
                          <span className="text-sm text-foreground">{tool.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected count */}
              {selectedToolIds.length > 0 && (
                <p className="text-xs text-muted-foreground pt-1">
                  已選擇 {isAllSelected ? "所有" : selectedToolIds.length} 個工具
                </p>
              )}
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
