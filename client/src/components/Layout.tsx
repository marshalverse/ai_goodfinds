import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Search, PenSquare, Bookmark, TrendingUp, Compass, GitCompare,
  BookOpen, LogOut, User, Menu, X, Sparkles, Star, Globe, Clock, Palette
} from "lucide-react";
import { useState } from "react";
import NotificationCenter from "@/components/NotificationCenter";
import Footer from "@/components/Footer";
import ToolSidebar from "@/components/ToolSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663513894733/EMmCrr8wS6ruYCgz6zaGkz/logo_8b48a01d.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { href: "/latest", label: t("nav.latest"), icon: Clock },
    { href: "/trending", label: t("nav.trending"), icon: TrendingUp },
    { href: "/showcase", label: t("nav.showcase"), icon: Palette },
    { href: "/prompts", label: t("nav.prompts"), icon: Compass },
    { href: "/compare", label: t("nav.compare"), icon: GitCompare },
    { href: "/guide", label: t("nav.guide"), icon: BookOpen },
    { href: "/wishlist", label: t("nav.wishlist"), icon: Star },
    { href: "/search", label: t("nav.search"), icon: Search },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src={LOGO_URL}
              alt="AI好物誌"
              className="w-9 h-9 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow"
            />
            <span className="text-lg font-bold gradient-text hidden sm:block">AI好物誌</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Globe className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => setLanguage("zh")}
                  className={`flex items-center gap-2 ${language === "zh" ? "bg-accent text-accent-foreground" : ""}`}
                >
                  🇹🇼 繁體中文
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className={`flex items-center gap-2 ${language === "en" ? "bg-accent text-accent-foreground" : ""}`}
                >
                  🇺🇸 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated ? (
              <>
                <Link href="/create">
                  <Button size="sm" className="gap-2 bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0">
                    <PenSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("nav.createPost")}</span>
                  </Button>
                </Link>
                <NotificationCenter />
                <Link href="/bookmarks">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      {user?.avatarUrl && user.avatarUrl.length > 0 ? (
                        <img src={user.avatarUrl} alt={user.name || "Avatar"} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] flex items-center justify-center text-white text-sm font-medium">
                          {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user?.id}`} className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t("nav.profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks" className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4" />
                        {t("nav.bookmarks")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-2 text-destructive">
                      <LogOut className="w-4 h-4" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0">
                  {t("nav.login")}
                </Button>
              </a>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg">
            <nav className="container py-3 flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start gap-3 ${isActive ? "bg-accent" : "text-muted-foreground"}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Body: Sidebar + Main */}
      <div className="flex flex-1">
        <ToolSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
