import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, Globe, Sparkles, Loader2, Wand2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearch, useParams } from "wouter";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

export default function CreatePost() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const preselectedTool = params.get("tool");
  const preselectedType = params.get("postType");
  const editId = params.get("edit");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedToolIds, setSelectedToolIds] = useState<number[]>(
    preselectedTool ? [parseInt(preselectedTool)] : []
  );
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [postType, setPostType] = useState<string>(preselectedType || "article");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: tools } = trpc.tools.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();
  const { data: existingPost } = trpc.posts.getById.useQuery(
    { id: parseInt(editId || "0") },
    { enabled: !!editId }
  );

  const allToolIds = useMemo(() => (tools || []).map(t => t.id), [tools]);

  // Load existing post data for editing
  useEffect(() => {
    if (existingPost && editId) {
      setIsEditMode(true);
      setTitle(existingPost.title);
      setContent(existingPost.content);
      setSummary(existingPost.summary || "");
      setPostType(existingPost.postType);
      if (existingPost.tools && existingPost.tools.length > 0) {
        setSelectedToolIds(existingPost.tools.map((t: any) => t.id));
      } else {
        setSelectedToolIds([existingPost.toolId]);
      }
      if (existingPost.tags) {
        setSelectedTags(existingPost.tags.map((t: any) => t.id));
      }
    }
  }, [existingPost, editId]);

  const createMutation = trpc.posts.create.useMutation({
    onSuccess: (data) => {
      toast.success("文章發表成功！");
      navigate(`/posts/${data.id}`);
    },
    onError: (err) => toast.error("發表失敗：" + err.message),
  });

  const updateMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      toast.success("文章更新成功！");
      navigate(`/posts/${editId}`);
    },
    onError: (err) => toast.error("更新失敗：" + err.message),
  });

  const summarizeMutation = trpc.ai.generateSummary.useMutation({
    onSuccess: (data) => {
      const text = typeof data.summary === "string" ? data.summary : "";
      setSummary(text);
      toast.success("摘要已自動生成！");
    },
    onError: () => toast.error("摘要生成失敗，請重試"),
  });

  const optimizeMutation = trpc.ai.optimizePrompt.useMutation({
    onSuccess: (data) => {
      const text = typeof data.result === "string" ? data.result : "";
      setContent(text);
      toast.success("提示詞已優化！");
    },
    onError: () => toast.error("優化失敗，請重試"),
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
      const next = prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId];
      setIsAllSelected(next.length === allToolIds.length && allToolIds.length > 0);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("請輸入標題"); return; }
    if (!content.trim()) { toast.error("請輸入內容"); return; }
    if (selectedToolIds.length === 0) { toast.error("請至少選擇一個 AI 工具"); return; }

    if (isEditMode && editId) {
      updateMutation.mutate({
        id: parseInt(editId),
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || undefined,
        toolId: selectedToolIds[0],
        toolIds: selectedToolIds,
        postType: postType as any,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || undefined,
        toolId: selectedToolIds[0],
        toolIds: selectedToolIds,
        postType: postType as any,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      });
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleGenerateSummary = () => {
    if (!content.trim()) { toast.error("請先撰寫文章內容"); return; }
    // Strip HTML tags for summary generation
    const textContent = content.replace(/<[^>]*>/g, "");
    summarizeMutation.mutate({ content: textContent, title: title.trim() || undefined });
  };

  const handleOptimizePrompt = () => {
    if (!content.trim()) { toast.error("請先輸入提示詞內容"); return; }
    const textContent = content.replace(/<[^>]*>/g, "");
    const toolName = tools?.find(t => selectedToolIds.includes(t.id))?.name;
    optimizeMutation.mutate({ prompt: textContent, toolName });
  };

  const toolsByCategory = useMemo(() => {
    return (tools || []).reduce<Record<string, typeof tools>>((acc, tool) => {
      const cat = tool.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat]!.push(tool);
      return acc;
    }, {});
  }, [tools]);

  const categoryLabels: Record<string, string> = {
    llm: "大型語言模型", image: "圖像生成", audio: "音訊生成",
    video: "影片生成", code: "程式開發", other: "其他",
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回
        </Button>
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-8">
        {isEditMode ? "編輯文章" : "發表新文章"}
      </h1>

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

          {/* Summary with AI */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="summary" className="text-sm font-medium text-foreground">
                摘要 <span className="text-muted-foreground font-normal">（選填）</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-primary hover:text-primary/80"
                onClick={handleGenerateSummary}
                disabled={summarizeMutation.isPending}
              >
                {summarizeMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                AI 自動生成摘要
              </Button>
            </div>
            <Input
              id="summary"
              placeholder="簡短描述文章內容..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="bg-secondary border-border/50"
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-foreground">
                內容 <span className="text-muted-foreground font-normal">（支援富文本格式）</span>
              </Label>
              {postType === "prompt" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-primary hover:text-primary/80"
                  onClick={handleOptimizePrompt}
                  disabled={optimizeMutation.isPending}
                >
                  {optimizeMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  AI 優化提示詞
                </Button>
              )}
            </div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="開始撰寫您的文章..."
            />
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Tool Selection */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">AI 工具 <span className="text-muted-foreground font-normal">（可複選）</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                  isAllSelected ? "bg-primary/10 border-primary/40" : "bg-secondary/50 border-border/30 hover:border-border/60"
                }`}
                onClick={handleToggleAll}
              >
                <Checkbox checked={isAllSelected} onCheckedChange={handleToggleAll} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">ALL（所有工具）</span>
              </div>

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
                            selectedToolIds.includes(tool.id) ? "bg-primary/10 border-primary/30" : "bg-transparent border-transparent hover:bg-secondary/50"
                          }`}
                          onClick={() => handleToggleTool(tool.id)}
                        >
                          <Checkbox checked={selectedToolIds.includes(tool.id)} onCheckedChange={() => handleToggleTool(tool.id)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tool.color || "#6366f1" }} />
                          <span className="text-sm text-foreground">{tool.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

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
                <SelectTrigger className="bg-secondary border-border/50"><SelectValue /></SelectTrigger>
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
                      selectedTags.includes(tag.id) ? "bg-primary/20 text-primary border-primary/40" : "hover:bg-secondary"
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
            disabled={isPending}
            onClick={handleSubmit}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isPending ? "處理中..." : isEditMode ? "更新文章" : "發表文章"}
          </Button>
        </div>
      </div>
    </div>
  );
}
