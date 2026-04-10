import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

type Language = "zh" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ===== Chinese Translations =====
const zh: Record<string, string> = {
  // Nav
  "nav.home": "首頁",
  "nav.prompts": "提示詞庫",
  "nav.trending": "熱門",
  "nav.compare": "工具比較",
  "nav.guide": "新手指南",
  "nav.wishlist": "許願池",
  "nav.search": "搜尋",
  "nav.createPost": "發表文章",
  "nav.bookmarks": "收藏",
  "nav.login": "登入",
  "nav.logout": "登出",
  "nav.profile": "個人檔案",
  "nav.notifications": "通知",

  // Sidebar
  "sidebar.title": "AI 工具討論群",
  "sidebar.all": "全部討論",
  "sidebar.llm": "語言模型",
  "sidebar.image": "圖像生成",
  "sidebar.audio": "音訊生成",
  "sidebar.video": "影片生成",
  "sidebar.code": "程式碼助手",
  "sidebar.other": "其他工具",

  // Home
  "home.badge": "探索 AI 的無限可能",
  "home.title1": "AI好物誌",
  "home.title2": "AI GoodFinds",
  "home.subtitle": "在這裡，您可以與全球 AI 愛好者交流使用經驗、分享提示詞技巧、探索各種 AI 工具的最佳實踐，並發現 AI 的無限潛力。",
  "home.cta.create": "開始發表文章",
  "home.cta.join": "加入社群",
  "home.cta.guide": "新手指南",
  "home.explore": "探索 AI 工具",
  "home.trending": "熱門文章",
  "home.viewAll": "查看全部",
  "home.recent": "最新文章",
  "home.stats.tools": "AI 工具",
  "home.stats.posts": "精選文章",
  "home.stats.users": "社群成員",
  "home.stats.prompts": "提示詞分享",
  "home.noPosts": "尚無文章，成為第一個發表的人吧！",

  // Post
  "post.create": "發表文章",
  "post.edit": "編輯文章",
  "post.title": "文章標題",
  "post.content": "文章內容",
  "post.selectTools": "選擇相關 AI 工具",
  "post.selectTags": "選擇標籤",
  "post.type": "文章類型",
  "post.type.article": "文章",
  "post.type.prompt": "提示詞",
  "post.publish": "發表",
  "post.update": "更新文章",
  "post.cancel": "取消",
  "post.allTools": "ALL（所有工具）",
  "post.toolRequired": "請至少選擇一個工具",
  "post.titleRequired": "請輸入標題",
  "post.contentRequired": "請輸入內容",
  "post.publishing": "發表中...",
  "post.updating": "更新中...",
  "post.deleteConfirm": "確定要刪除這篇文章嗎？",
  "post.comments": "則評論",
  "post.addComment": "發表評論...",
  "post.submitComment": "送出",
  "post.noComments": "尚無評論，成為第一個留言的人吧！",
  "post.loginToComment": "登入後即可評論",
  "post.loginToLike": "登入後即可按讚",
  "post.loginToBookmark": "登入後即可收藏",

  // AI Assistant
  "ai.title": "AI 助手",
  "ai.optimizePrompt": "優化提示詞",
  "ai.generateSummary": "生成摘要",
  "ai.optimizing": "AI 正在優化...",
  "ai.summarizing": "AI 正在生成摘要...",

  // Search
  "search.title": "搜尋",
  "search.placeholder": "搜尋文章、提示詞、工具...",
  "search.results": "搜尋結果",
  "search.noResults": "沒有找到相關結果",
  "search.filter.all": "全部",
  "search.filter.article": "文章",
  "search.filter.prompt": "提示詞",
  "search.sortBy": "排序",
  "search.sort.latest": "最新",
  "search.sort.popular": "最熱門",
  "search.sort.mostLiked": "最多讚",

  // Compare
  "compare.title": "AI 工具比較專區",
  "compare.subtitle": "探索不同 AI 工具在各種任務上的表現比較，幫助您選擇最適合的工具。",
  "compare.selectTools": "選擇要比較的工具",
  "compare.discussions": "相關比較討論",

  // Guide
  "guide.title": "新手指南",
  "guide.subtitle": "為每個主流 AI 工具提供入門教學和最佳實踐，幫助您快速上手。",
  "guide.getStarted": "開始學習",

  // Prompts
  "prompts.title": "提示詞庫",
  "prompts.subtitle": "探索和分享各種 AI 工具的提示詞，提升您的 AI 使用效率。",
  "prompts.share": "分享提示詞",

  // Trending
  "trending.title": "熱門排行榜",
  "trending.subtitle": "查看社群中最受歡迎的文章和提示詞。",
  "trending.period.week": "本週",
  "trending.period.month": "本月",
  "trending.period.all": "全部時間",

  // Profile
  "profile.title": "個人檔案",
  "profile.posts": "篇文章",
  "profile.likes": "獲得讚數",
  "profile.tools": "擅長工具",
  "profile.preferredTools": "擅長的 AI 工具",
  "profile.publishedPosts": "發表的文章",
  "profile.joinedAt": "加入時間",
  "profile.bio": "個人簡介",
  "profile.editProfile": "編輯個人檔案",
  "profile.favoriteTools": "擅長的工具",
  "profile.uploadAvatar": "上傳大頭貼",
  "profile.changeAvatar": "更換大頭貼",
  "profile.editName": "編輯名稱",
  "profile.editBio": "編輯簡介",
  "profile.name": "名稱",
  "profile.bioPlaceholder": "請輸入您的個人簡介...",
  "profile.namePlaceholder": "請輸入您的名稱...",
  "profile.save": "儲存",
  "profile.cancel": "取消",
  "profile.saving": "儲存中...",
  "profile.uploadingAvatar": "上傳中...",
  "profile.addBio": "新增簡介",

  // Bookmarks
  "bookmarks.title": "我的收藏",
  "bookmarks.empty": "尚無收藏文章",

  // Wishlist
  "wishlist.title": "許願池",
  "wishlist.subtitle": "有什麼想要的功能或內容嗎？告訴我們！",
  "wishlist.subject": "主旨",
  "wishlist.content": "內容",
  "wishlist.email": "聯絡信箱（選填）",
  "wishlist.submit": "提交建議",
  "wishlist.submitting": "提交中...",
  "wishlist.success": "感謝您的建議！我們會盡快查看。",

  // Notifications
  "notifications.title": "通知",
  "notifications.empty": "暫無通知",
  "notifications.markAllRead": "全部已讀",
  "notifications.liked": "按讚了您的文章",
  "notifications.commented": "評論了您的文章",

  // Create
  "create.title": "發表新文章",
  "create.editTitle": "編輯文章",
  "create.postType": "文章類型",
  "create.tags": "標籤",
  "create.publish": "發表文章",
  "create.update": "更新文章",
  "create.type.article": "文章",
  "create.type.prompt": "提示詞分享",
  "create.type.tutorial": "教學",
  "create.type.question": "問題求助",
  "create.type.comparison": "工具比較",
  "create.type.other": "其他",

  // Common
  "common.loading": "載入中...",
  "common.error": "發生錯誤",
  "common.retry": "重試",
  "common.save": "儲存",
  "common.cancel": "取消",
  "common.delete": "刪除",
  "common.edit": "編輯",
  "common.share": "分享",
  "common.back": "返回",
  "common.more": "更多",
  "common.viewAll": "查看全部",
  "common.comingSoon": "功能即將推出",

  // Footer
  "footer.company": "marshalvision.co",
  "footer.contact": "聯絡我們",
  "footer.rights": "版權所有",
  "footer.description": "AI好物誌是一個專注於 AI 工具交流與分享的社群平台。",
};

// ===== English Translations =====
const en: Record<string, string> = {
  // Nav
  "nav.home": "Home",
  "nav.prompts": "Prompts",
  "nav.trending": "Trending",
  "nav.compare": "Compare",
  "nav.guide": "Guide",
  "nav.wishlist": "Wishlist",
  "nav.search": "Search",
  "nav.createPost": "Create Post",
  "nav.bookmarks": "Bookmarks",
  "nav.login": "Login",
  "nav.logout": "Logout",
  "nav.profile": "Profile",
  "nav.notifications": "Notifications",

  // Sidebar
  "sidebar.title": "AI Tool Groups",
  "sidebar.all": "All Discussions",
  "sidebar.llm": "Language Models",
  "sidebar.image": "Image Generation",
  "sidebar.audio": "Audio Generation",
  "sidebar.video": "Video Generation",
  "sidebar.code": "Code Assistants",
  "sidebar.other": "Other Tools",

  // Home
  "home.badge": "Explore the Infinite Possibilities of AI",
  "home.title1": "AI好物誌",
  "home.title2": "AI GoodFinds",
  "home.subtitle": "Exchange AI experiences, share prompt techniques, explore best practices for various AI tools, and discover the limitless potential of AI.",
  "home.cta.create": "Start Writing",
  "home.cta.join": "Join Community",
  "home.cta.guide": "Beginner's Guide",
  "home.explore": "Explore AI Tools",
  "home.trending": "Trending Posts",
  "home.viewAll": "View All",
  "home.recent": "Recent Posts",
  "home.stats.tools": "AI Tools",
  "home.stats.posts": "Featured Posts",
  "home.stats.users": "Community Members",
  "home.stats.prompts": "Shared Prompts",
  "home.noPosts": "No posts yet. Be the first to share!",

  // Post
  "post.create": "Create Post",
  "post.edit": "Edit Post",
  "post.title": "Title",
  "post.content": "Content",
  "post.selectTools": "Select Related AI Tools",
  "post.selectTags": "Select Tags",
  "post.type": "Post Type",
  "post.type.article": "Article",
  "post.type.prompt": "Prompt",
  "post.publish": "Publish",
  "post.update": "Update",
  "post.cancel": "Cancel",
  "post.allTools": "ALL (All Tools)",
  "post.toolRequired": "Please select at least one tool",
  "post.titleRequired": "Please enter a title",
  "post.contentRequired": "Please enter content",
  "post.publishing": "Publishing...",
  "post.updating": "Updating...",
  "post.deleteConfirm": "Are you sure you want to delete this post?",
  "post.comments": "comments",
  "post.addComment": "Add a comment...",
  "post.submitComment": "Submit",
  "post.noComments": "No comments yet. Be the first to comment!",
  "post.loginToComment": "Login to comment",
  "post.loginToLike": "Login to like",
  "post.loginToBookmark": "Login to bookmark",

  // AI Assistant
  "ai.title": "AI Assistant",
  "ai.optimizePrompt": "Optimize Prompt",
  "ai.generateSummary": "Generate Summary",
  "ai.optimizing": "AI is optimizing...",
  "ai.summarizing": "AI is generating summary...",

  // Search
  "search.title": "Search",
  "search.placeholder": "Search posts, prompts, tools...",
  "search.results": "Search Results",
  "search.noResults": "No results found",
  "search.filter.all": "All",
  "search.filter.article": "Articles",
  "search.filter.prompt": "Prompts",
  "search.sortBy": "Sort by",
  "search.sort.latest": "Latest",
  "search.sort.popular": "Most Popular",
  "search.sort.mostLiked": "Most Liked",

  // Compare
  "compare.title": "AI Tool Comparison",
  "compare.subtitle": "Explore comparisons of different AI tools across various tasks to help you choose the best fit.",
  "compare.selectTools": "Select tools to compare",
  "compare.discussions": "Related Discussions",

  // Guide
  "guide.title": "Beginner's Guide",
  "guide.subtitle": "Step-by-step tutorials and best practices for every major AI tool to help you get started quickly.",
  "guide.getStarted": "Get Started",

  // Prompts
  "prompts.title": "Prompt Library",
  "prompts.subtitle": "Explore and share prompts for various AI tools to boost your AI productivity.",
  "prompts.share": "Share Prompt",

  // Trending
  "trending.title": "Trending",
  "trending.subtitle": "Discover the most popular posts and prompts in the community.",
  "trending.period.week": "This Week",
  "trending.period.month": "This Month",
  "trending.period.all": "All Time",

  // Profile
  "profile.title": "Profile",
  "profile.posts": "Posts",
  "profile.likes": "Likes Received",
  "profile.tools": "Tools",
  "profile.preferredTools": "Preferred AI Tools",
  "profile.publishedPosts": "Published Posts",
  "profile.joinedAt": "Joined",
  "profile.bio": "Bio",
  "profile.editProfile": "Edit Profile",
  "profile.favoriteTools": "Favorite Tools",
  "profile.uploadAvatar": "Upload Avatar",
  "profile.changeAvatar": "Change Avatar",
  "profile.editName": "Edit Name",
  "profile.editBio": "Edit Bio",
  "profile.name": "Name",
  "profile.bioPlaceholder": "Enter your bio...",
  "profile.namePlaceholder": "Enter your name...",
  "profile.save": "Save",
  "profile.cancel": "Cancel",
  "profile.saving": "Saving...",
  "profile.uploadingAvatar": "Uploading...",
  "profile.addBio": "Add Bio",

  // Bookmarks
  "bookmarks.title": "My Bookmarks",
  "bookmarks.empty": "No bookmarked posts yet",

  // Wishlist
  "wishlist.title": "Wishlist",
  "wishlist.subtitle": "Have a feature or content request? Let us know!",
  "wishlist.subject": "Subject",
  "wishlist.content": "Content",
  "wishlist.email": "Contact Email (optional)",
  "wishlist.submit": "Submit Suggestion",
  "wishlist.submitting": "Submitting...",
  "wishlist.success": "Thank you for your suggestion! We'll review it soon.",

  // Notifications
  "notifications.title": "Notifications",
  "notifications.empty": "No notifications",
  "notifications.markAllRead": "Mark All Read",
  "notifications.liked": "liked your post",
  "notifications.commented": "commented on your post",

  // Create
  "create.title": "Create New Post",
  "create.editTitle": "Edit Post",
  "create.postType": "Post Type",
  "create.tags": "Tags",
  "create.publish": "Publish",
  "create.update": "Update Post",
  "create.type.article": "Article",
  "create.type.prompt": "Prompt Sharing",
  "create.type.tutorial": "Tutorial",
  "create.type.question": "Question",
  "create.type.comparison": "Comparison",
  "create.type.other": "Other",

  // Common
  "common.loading": "Loading...",
  "common.error": "An error occurred",
  "common.retry": "Retry",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.share": "Share",
  "common.back": "Back",
  "common.more": "More",
  "common.viewAll": "View All",
  "common.comingSoon": "Coming Soon",

  // Footer
  "footer.company": "marshalvision.co",
  "footer.contact": "Contact Us",
  "footer.rights": "All Rights Reserved",
  "footer.description": "AI GoodFinds is a community platform focused on AI tool exchange and sharing.",
};

const translations: Record<Language, Record<string, string>> = { zh, en };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai-goodfinds-lang");
      if (saved === "zh" || saved === "en") return saved;
    }
    return "zh";
  });

  useEffect(() => {
    localStorage.setItem("ai-goodfinds-lang", language);
    document.documentElement.lang = language === "zh" ? "zh-TW" : "en";
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
