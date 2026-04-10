import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, Globe, Sparkles, Loader2, Wand2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CreatePost() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const preselectedTool = params.get("tool");
  const editId = params.get("edit");
  const { t, language } = useLanguage();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedToolIds, setSelectedToolIds] = useState<number[]>(
    preselectedTool ? [parseInt(preselectedTool)] : []
  );
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: tools } = trpc.tools.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();
  const { data: existingPost } = trpc.posts.getById.useQuery(
    { id: parseInt(editId || "0") },
    { enabled: !!editId }
  );

  const allToolIds = useMemo(() => (tools || []).map(t => t.id), [tools]);

  useEffect(() => {
    if (existingPost && editId) {
      setIsEditMode(true);
      setTitle(existingPost.title);
      setContent(existingPost.content);
      setSummary(existingPost.summary || "");
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
      toast.success(language === "zh" ? "文章發表成功！" : "Post published successfully!");
      navigate(`/posts/${data.id}`);
    },
    onError: (err) => toast.error((language === "zh" ? "發表失敗：" : "Failed: ") + err.message),
  });

  const updateMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      toast.success(language === "zh" ? "文章更新成功！" : "Post updated successfully!");
      navigate(`/posts/${editId}`);
    },
    onError: (err) => toast.error((language === "zh" ? "更新失敗：" : "Update failed: ") + err.message),
  });

  const summarizeMutation = trpc.ai.generateSummary.useMutation({
    onSuccess: (data) => {
      const text = typeof data.summary === "string" ? data.summary : "";
      setSummary(text);
      toast.success(language === "zh" ? "摘要已自動生成！" : "Summary generated!");
    },
    onError: () => toast.error(language === "zh" ? "摘要生成失敗，請重試" : "Summary generation failed"),
  });

  const suggestTagsMutation = trpc.ai.suggestTags.useMutation({
    onSuccess: (data) => {
      if (data.tagIds.length > 0) {
        setSelectedTags(data.tagIds);
        toast.success(
          language === "zh"
            ? `AI 已自動選取 ${data.tagNames.join("、")} 標籤`
            : `AI selected tags: ${data.tagNames.join(", ")}`
        );
      } else {
        toast.info(language === "zh" ? "AI 無法判斷適合的標籤，請手動選取" : "AI couldn't determine tags, please select manually");
      }
    },
    onError: () => toast.error(language === "zh" ? "標籤推薦失敗，請重試" : "Tag suggestion failed"),
  });

  const optimizeMutation = trpc.ai.optimizePrompt.useMutation({
    onSuccess: (data) => {
      const text = typeof data.result === "string" ? data.result : "";
      setContent(text);
      toast.success(language === "zh" ? "提示詞已優化！" : "Prompt optimized!");
    },
    onError: () => toast.error(language === "zh" ? "優化失敗，請重試" : "Optimization failed"),
  });

  const toolsByCategory = useMemo(() => {
    const grouped = (tools || []).reduce<Record<string, typeof tools>>((acc, tool) => {
      const cat = tool.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat]!.push(tool);
      return acc;
    }, {});
    const categoryOrder = ['llm', 'image', 'audio', 'video', 'code', 'other'];
    const sorted: Record<string, typeof tools> = {};
    for (const cat of categoryOrder) {
      if (grouped[cat]) sorted[cat] = grouped[cat];
    }
    for (const cat of Object.keys(grouped)) {
      if (!sorted[cat]) sorted[cat] = grouped[cat];
    }
    return sorted;
  }, [tools]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">{language === "zh" ? "載入中..." : "Loading..."}</p>
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
    if (!title.trim()) { toast.error(language === "zh" ? "請輸入標題" : "Please enter a title"); return; }
    if (!content.trim()) { toast.error(language === "zh" ? "請輸入內容" : "Please enter content"); return; }
    if (selectedToolIds.length === 0) { toast.error(language === "zh" ? "請至少選擇一個 AI 工具" : "Please select at least one AI tool"); return; }

    if (isEditMode && editId) {
      updateMutation.mutate({
        id: parseInt(editId),
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || undefined,
        toolId: selectedToolIds[0],
        toolIds: selectedToolIds,
        postType: "article" as any,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || undefined,
        toolId: selectedToolIds[0],
        toolIds: selectedToolIds,
        postType: "article" as any,
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
    if (!content.trim()) { toast.error(language === "zh" ? "請先撰寫文章內容" : "Please write content first"); return; }
    const textContent = content.replace(/<[^>]*>/g, "");
    summarizeMutation.mutate({ content: textContent, title: title.trim() || undefined });
  };

  const handleSuggestTags = () => {
    if (!title.trim()) {
      toast.error(language === "zh" ? "請先輸入標題" : "Please enter a title first");
      return;
    }
    const textContent = content.replace(/<[^>]*>/g, "");
    suggestTagsMutation.mutate({
      title: title.trim(),
      content: textContent || undefined,
    });
  };

  const handleOptimizePrompt = () => {
    if (!content.trim()) { toast.error(language === "zh" ? "請先輸入提示詞內容" : "Please enter prompt content first"); return; }
    const textContent = content.replace(/<[^>]*>/g, "");
    const toolName = tools?.find(t => selectedToolIds.includes(t.id))?.name;
    optimizeMutation.mutate({ prompt: textContent, toolName });
  };

  const categoryLabels: Record<string, string> = language === "zh" ? {
    llm: "大型語言模型", image: "圖像生成", audio: "音訊生成",
    video: "影片生成", code: "程式開發", other: "其他",
  } : {
    llm: "Language Models", image: "Image Generation", audio: "Audio Generation",
    video: "Video Generation", code: "Code Development", other: "Other",
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t("common.back")}
        </Button>
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-8">
        {isEditMode ? t("create.editTitle") : t("create.title")}
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
              {language === "zh" ? "標題" : "Title"}
            </Label>
            <Input
              id="title"
              placeholder={language === "zh" ? "輸入文章標題..." : "Enter post title..."}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-border/50 text-lg"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="summary" className="text-sm font-medium text-foreground">
                {language === "zh" ? "摘要" : "Summary"} <span className="text-muted-foreground font-normal">
                  ({language === "zh" ? "選填" : "Optional"})
                </span>
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
                {language === "zh" ? "AI 自動生成摘要" : "AI Generate Summary"}
              </Button>
            </div>
            <Input
              id="summary"
              placeholder={language === "zh" ? "簡短描述文章內容..." : "Brief description..."}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="bg-secondary border-border/50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-foreground">
                {language === "zh" ? "內容" : "Content"} <span className="text-muted-foreground font-normal">
                  ({language === "zh" ? "支援富文本格式" : "Rich text supported"})
                </span>
              </Label>
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
                {language === "zh" ? "AI 優化提示詞" : "AI Optimize Prompt"}
              </Button>
            </div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder={language === "zh" ? "開始撰寫您的文章..." : "Start writing your article..."}
            />
          </div>

          {/* Publish button - below content area */}
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
            {isPending
              ? (language === "zh" ? "處理中..." : "Processing...")
              : isEditMode
                ? t("create.update")
                : t("create.publish")}
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {language === "zh" ? "AI 工具" : "AI Tools"} <span className="text-muted-foreground font-normal">
                  ({language === "zh" ? "可複選" : "Multi-select"})
                </span>
              </CardTitle>
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
                <span className="text-sm font-medium text-foreground">ALL ({language === "zh" ? "所有工具" : "All Tools"})</span>
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
                  {language === "zh"
                    ? `已選擇 ${isAllSelected ? "所有" : selectedToolIds.length} 個工具`
                    : `${isAllSelected ? "All" : selectedToolIds.length} tool(s) selected`}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{t("create.tags")}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-primary hover:text-primary/80 h-7 px-2"
                  onClick={handleSuggestTags}
                  disabled={suggestTagsMutation.isPending}
                >
                  {suggestTagsMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {language === "zh" ? "AI 自動偵測" : "AI Detect"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[...(tags || [])].sort((a, b) => {
                  const aIsOther = a.name === '其他' || a.name?.toLowerCase() === 'other';
                  const bIsOther = b.name === '其他' || b.name?.toLowerCase() === 'other';
                  if (aIsOther && !bIsOther) return 1;
                  if (!aIsOther && bIsOther) return -1;
                  return 0;
                }).map((tag) => (
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

        </div>
      </div>
    </div>
  );
}
