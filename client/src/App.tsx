import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import ToolPage from "./pages/ToolPage";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import ComparePage from "./pages/ComparePage";
import GuidePage from "./pages/GuidePage";
import TrendingPage from "./pages/TrendingPage";
import BookmarksPage from "./pages/BookmarksPage";
import PromptsPage from "./pages/PromptsPage";
import WishlistPage from "./pages/WishlistPage";
import Layout from "./components/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tools/:slug" component={ToolPage} />
        <Route path="/posts/:id" component={PostDetail} />
        <Route path="/create" component={CreatePost} />
        <Route path="/profile/:id" component={ProfilePage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/compare" component={ComparePage} />
        <Route path="/guide" component={GuidePage} />
        <Route path="/guide/:slug" component={GuidePage} />
        <Route path="/trending" component={TrendingPage} />
        <Route path="/bookmarks" component={BookmarksPage} />
        <Route path="/prompts" component={PromptsPage} />
        <Route path="/wishlist" component={WishlistPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
