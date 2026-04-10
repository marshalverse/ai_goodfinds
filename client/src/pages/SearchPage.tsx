import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("latest");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLanguage();

  const { data: tools } = trpc.tools.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();

  const sortedTags = useMemo(() => {
    if (!tags) return [];
    return [...tags].sort((a, b) => {
      const aIsOther = a.name === '其他' || a.name?.toLowerCase() === 'other';
      const bIsOther = b.name === '其他' || b.name?.toLowerCase() === 'other';
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return 0;
    });
  }, [tags]);

  const { data: results, isLoading } = trpc.posts.list.useQuery({
    search: query || undefined,
    toolId: toolFilter !== "all" ? parseInt(toolFilter) : undefined,
    postType: typeFilter !== "all" ? typeFilter : undefined,
    tagId: tagFilter,
    sortBy,
    limit: 30,
  }, { enabled: submitted || toolFilter !== "all" || typeFilter !== "all" || !!tagFilter });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">{t("search.title")}</h1>
      <p className="text-muted-foreground mb-8">{t("search.placeholder")}</p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 bg-secondary border-border/50 h-12 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0 px-8">
          {t("search.title")}
        </Button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-secondary/50 rounded-xl border border-border/30">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        <Select value={toolFilter} onValueChange={(v) => { setToolFilter(v); setSubmitted(true); }}>
          <SelectTrigger className="w-36 bg-background border-border/50">
            <SelectValue placeholder={t("search.filter.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("search.filter.all")}</SelectItem>
            {(tools || []).map((tool) => (
              <SelectItem key={tool.id} value={String(tool.id)}>{tool.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setSubmitted(true); }}>
          <SelectTrigger className="w-32 bg-background border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">{t("search.sort.latest")}</SelectItem>
            <SelectItem value="popular">{t("search.sort.popular")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tag Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Badge
          variant={tagFilter === undefined ? "default" : "outline"}
          className={`cursor-pointer ${tagFilter === undefined ? "bg-primary/20 text-primary border-primary/40" : "hover:bg-secondary"}`}
          onClick={() => { setTagFilter(undefined); setSubmitted(true); }}
        >
          {t("search.filter.all")}
        </Badge>
        {sortedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant={tagFilter === tag.id ? "default" : "outline"}
            className={`cursor-pointer ${tagFilter === tag.id ? "bg-primary/20 text-primary border-primary/40" : "hover:bg-secondary"}`}
            onClick={() => { setTagFilter(tag.id); setSubmitted(true); }}
          >
            {tag.name}
          </Badge>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : results?.posts && results.posts.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">{t("search.results")}: {results.total}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      ) : submitted ? (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("search.noResults")}</h3>
        </div>
      ) : (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{t("search.placeholder")}</p>
        </div>
      )}
    </div>
  );
}
