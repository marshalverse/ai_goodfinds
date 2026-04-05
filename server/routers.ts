import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== AI Tools =====
  tools: router({
    list: publicProcedure.query(async () => {
      return db.getAllTools();
    }),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      return db.getToolBySlug(input.slug);
    }),
  }),

  // ===== Tags =====
  tags: router({
    list: publicProcedure.query(async () => {
      return db.getAllTags();
    }),
  }),

  // ===== Image Upload =====
  upload: router({
    image: protectedProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string(),
      fileName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "png";
      const fileName = input.fileName || `image-${nanoid(8)}.${ext}`;
      const fileKey = `uploads/${ctx.user.id}/${nanoid(12)}-${fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      return { url };
    }),
  }),

  // ===== Posts =====
  posts: router({
    create: protectedProcedure.input(z.object({
      toolId: z.number(),
      toolIds: z.array(z.number()).optional(),
      title: z.string().min(1).max(300),
      content: z.string().min(1),
      summary: z.string().optional(),
      postType: z.enum(["article", "prompt", "tutorial", "question", "comparison"]).optional(),
      tagIds: z.array(z.number()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const postId = await db.createPost({
        authorId: ctx.user.id,
        toolId: input.toolId,
        toolIds: input.toolIds,
        title: input.title,
        content: input.content,
        summary: input.summary,
        postType: input.postType,
        tagIds: input.tagIds,
      });
      return { id: postId };
    }),

    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).max(300).optional(),
      content: z.string().min(1).optional(),
      summary: z.string().optional(),
      toolId: z.number().optional(),
      toolIds: z.array(z.number()).optional(),
      postType: z.enum(["article", "prompt", "tutorial", "question", "comparison"]).optional(),
      tagIds: z.array(z.number()).optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.updatePost(input.id, ctx.user.id, {
        title: input.title,
        content: input.content,
        summary: input.summary,
        toolId: input.toolId,
        toolIds: input.toolIds,
        postType: input.postType,
        tagIds: input.tagIds,
      });
      return { success: true };
    }),

    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getPostById(input.id);
    }),

    list: publicProcedure.input(z.object({
      toolId: z.number().optional(),
      tagId: z.number().optional(),
      postType: z.string().optional(),
      search: z.string().optional(),
      sortBy: z.string().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    })).query(async ({ input }) => {
      return db.getPosts(input);
    }),

    trending: publicProcedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => {
      return db.getTrendingPosts(input.limit);
    }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deletePost(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  // ===== Comments =====
  comments: router({
    create: protectedProcedure.input(z.object({
      postId: z.number(),
      content: z.string().min(1),
      parentId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const commentId = await db.createComment({
        postId: input.postId,
        authorId: ctx.user.id,
        content: input.content,
        parentId: input.parentId,
      });
      // Create notification for post author
      const post = await db.getPostById(input.postId);
      if (post && post.authorId !== ctx.user.id) {
        await db.createNotification({
          userId: post.authorId,
          type: "comment",
          message: `${ctx.user.name || "有人"} 評論了您的文章「${post.title}」`,
          relatedPostId: input.postId,
          relatedUserId: ctx.user.id,
        });
      }
      return { id: commentId };
    }),

    getByPostId: publicProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
      return db.getCommentsByPostId(input.postId);
    }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteComment(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  // ===== Likes =====
  likes: router({
    toggle: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
      const liked = await db.toggleLike(ctx.user.id, input.postId);
      // Create notification for post author when liked
      if (liked) {
        const post = await db.getPostById(input.postId);
        if (post && post.authorId !== ctx.user.id) {
          await db.createNotification({
            userId: post.authorId,
            type: "like",
            message: `${ctx.user.name || "有人"} 按讚了您的文章「${post.title}」`,
            relatedPostId: input.postId,
            relatedUserId: ctx.user.id,
          });
        }
      }
      return { liked };
    }),
    userLikedPosts: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserLikedPostIds(ctx.user.id);
    }),
  }),

  // ===== Bookmarks =====
  bookmarks: router({
    toggle: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
      const bookmarked = await db.toggleBookmark(ctx.user.id, input.postId);
      return { bookmarked };
    }),
    userBookmarkedPosts: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserBookmarkedPostIds(ctx.user.id);
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserBookmarkedPosts(ctx.user.id);
    }),
  }),

  // ===== Notifications =====
  notifications: router({
    list: protectedProcedure.input(z.object({
      limit: z.number().optional(),
    })).query(async ({ ctx, input }) => {
      return db.getNotifications(ctx.user.id, input.limit);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
    markAsRead: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ ctx, input }) => {
      await db.markNotificationAsRead(input.id, ctx.user.id);
      return { success: true };
    }),
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ===== AI Assistant =====
  ai: router({
    optimizePrompt: protectedProcedure.input(z.object({
      prompt: z.string().min(1),
      toolName: z.string().optional(),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `你是一位專業的 AI 提示詞優化專家。請幫助使用者優化他們的提示詞，使其更加清晰、具體、有效。${input.toolName ? `目標 AI 工具是 ${input.toolName}。` : ""}
回覆格式：
1. 先簡短說明優化了哪些方面
2. 然後給出優化後的完整提示詞（用 --- 分隔）`,
          },
          {
            role: "user",
            content: `請優化以下提示詞：\n\n${input.prompt}`,
          },
        ],
      });
      return { result: response.choices[0]?.message?.content || "" };
    }),

    generateSummary: protectedProcedure.input(z.object({
      content: z.string().min(1),
      title: z.string().optional(),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "你是一位專業的文章摘要生成專家。請根據文章內容生成一段簡潔、精確的摘要，長度在 50-150 字之間。只需要回覆摘要內容，不需要其他說明。",
          },
          {
            role: "user",
            content: `${input.title ? `文章標題：${input.title}\n\n` : ""}文章內容：\n\n${input.content}`,
          },
        ],
      });
      return { summary: response.choices[0]?.message?.content || "" };
    }),
  }),

  // ===== Wishlist (許願池) =====
  wishlist: router({
    submit: publicProcedure.input(z.object({
      subject: z.string().min(1).max(200),
      content: z.string().min(1).max(5000),
      email: z.string().email().optional(),
    })).mutation(async ({ input }) => {
      // Notify owner via built-in notification
      await notifyOwner({
        title: `[許願池] ${input.subject}`,
        content: `來自使用者的許願：\n\n主旨：${input.subject}\n${input.email ? `聯絡信箱：${input.email}\n` : ""}\n內容：\n${input.content}`,
      });
      return { success: true };
    }),
  }),

  // ===== User Profile =====
  profile: router({
    get: publicProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
      return db.getUserProfile(input.userId);
    }),
    update: protectedProcedure.input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      avatarUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),
    setToolPreferences: protectedProcedure.input(z.object({
      toolIds: z.array(z.number()),
    })).mutation(async ({ ctx, input }) => {
      await db.setUserToolPreferences(ctx.user.id, input.toolIds);
      return { success: true };
    }),
    myPosts: protectedProcedure.input(z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
    })).query(async ({ ctx, input }) => {
      return db.getPostsByAuthor(ctx.user.id, input.page, input.limit);
    }),
  }),
});

export type AppRouter = typeof appRouter;
