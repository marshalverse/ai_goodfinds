import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft, ChevronRight, Layers, MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663513894733/EMmCrr8wS6ruYCgz6zaGkz/logo_8b48a01d.png";

const categoryOrder = ["llm", "image", "audio", "video", "code", "other"];

export default function ToolSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const [location] = useLocation();
  const { t } = useLanguage();

  const { data: tools } = trpc.tools.list.useQuery();

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      if (newWidth >= 180 && newWidth <= 400) {
        setWidth(newWidth);
      }
      if (newWidth < 120) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Group tools by their category field from DB
  const toolsByCategory = (tools || []).reduce<Record<string, any[]>>((acc, tool: any) => {
    const cat = tool.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {});

  const orderedCategories = categoryOrder.filter((cat) => toolsByCategory[cat]?.length);

  if (collapsed) {
    return (
      <div className="hidden lg:flex flex-col items-center py-4 w-12 border-r border-border/40 bg-card/30 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mb-4 text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(false)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="flex flex-col gap-2 items-center">
          {tools?.slice(0, 10).map((tool: any) => (
            <Link key={tool.id} href={`/tools/${tool.slug}`}>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                  location === `/tools/${tool.slug}`
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:ring-1 hover:ring-border"
                }`}
                style={{ backgroundColor: `${tool.color}25`, color: tool.color }}
                title={tool.name}
              >
                {tool.name[0]}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="hidden lg:flex flex-col border-r border-border/40 bg-card/30 shrink-0 relative"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{t("sidebar.title")}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Tool List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Tools Link */}
          <Link href="/">
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1 transition-colors cursor-pointer ${
              location === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}>
              <div className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <img src={LOGO_URL} alt="AI好物誌" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-sm font-medium truncate">{t("sidebar.all")}</span>
            </div>
          </Link>

          {/* Categorized Tools */}
          {orderedCategories.map((cat) => (
            <div key={cat} className="mt-3">
              <p className="text-xs text-muted-foreground/70 font-medium uppercase tracking-wider px-3 mb-1.5">
                {t(`sidebar.${cat}`)}
              </p>
              {toolsByCategory[cat].map((tool: any) => {
                const isActive = location === `/tools/${tool.slug}`;
                return (
                  <Link key={tool.id} href={`/tools/${tool.slug}`}>
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-all cursor-pointer group ${
                      isActive
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}>
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: `${tool.color}20`, color: tool.color }}
                      >
                        {tool.name[0]}
                      </div>
                      <span className="text-sm truncate">{tool.name}</span>
                      {isActive && (
                        <MessageSquare className="w-3.5 h-3.5 ml-auto text-primary shrink-0" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Resize Handle */}
      <div
        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/30 transition-colors z-10 ${
          isResizing ? "bg-primary/40" : ""
        }`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
