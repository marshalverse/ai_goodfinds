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
import nodemailer from "nodemailer";

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
    contentSuggestion: protectedProcedure.input(z.object({
      title: z.string().min(1),
      content: z.string().optional(),
    })).mutation(async ({ input }) => {
      const textContent = input.content ? input.content.replace(/<[^>]*>/g, '').trim() : '';
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `你是一位專業的文章寫作顧問。請根據使用者的文章標題和內容，提供具體的改進建議和寫作提示。\n\n回覆格式（使用繁體中文）：\n1. **內容完整性**：文章是否涵蓋了主題的關鍵面向，有哪些可以補充的\n2. **結構建議**：文章結構是否清晰，段落安排是否合理\n3. **吸引力提升**：如何讓文章更吸引讀者\n4. **具體寫作提示**：給出 2-3 個具體的寫作方向或可以加入的內容\n\n請保持建議簡潔實用，每點不超過 2-3 句話。`,
          },
          {
            role: "user",
            content: `文章標題：${input.title}${textContent ? `\n\n文章內容：\n${textContent.slice(0, 2000)}` : '\n\n（尚未撰寫內容）'}`,
          },
        ],
      });
      const rawContent = response.choices[0]?.message?.content;
      return { suggestion: typeof rawContent === 'string' ? rawContent : '' };
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

    suggestTags: protectedProcedure.input(z.object({
      title: z.string().min(1),
      content: z.string().optional(),
    })).mutation(async ({ input }) => {
      const allTags = await db.getAllTags();
      const tagNames = allTags.map(t => t.name).join(', ');

      const textContent = input.content ? input.content.replace(/<[^>]*>/g, '').slice(0, 2000) : '';

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `你是一個文章標籤分類專家。根據文章的標題和內容，從以下可用標籤中選擇最適合的標籤（可多選）。\n\n可用標籤：${tagNames}\n\n請只回覆 JSON 格式，不要包含其他文字。格式為：{"tags": ["標籤1", "標籤2"]}\n\n規則：\n1. 只能選擇上述可用標籤中的標籤\n2. 選擇 1-3 個最相關的標籤\n3. 如果內容不明確屬於任何特定標籤，選擇「其他」`,
          },
          {
            role: "user",
            content: `標題：${input.title}${textContent ? `\n\n內容摘要：${textContent.slice(0, 1000)}` : ''}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "tag_suggestion",
            strict: true,
            schema: {
              type: "object",
              properties: {
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Suggested tag names from the available list",
                },
              },
              required: ["tags"],
              additionalProperties: false,
            },
          },
        },
      });

      try {
        const rawContent = response.choices[0]?.message?.content;
        const contentStr = typeof rawContent === 'string' ? rawContent : '{"tags":[]}';
        const parsed = JSON.parse(contentStr);
        const suggestedNames: string[] = parsed.tags || [];
        const suggestedIds = allTags
          .filter(t => suggestedNames.includes(t.name))
          .map(t => t.id);
        return { tagIds: suggestedIds, tagNames: suggestedNames };
      } catch {
        return { tagIds: [], tagNames: [] };
      }
    }),
  }),

  // ===== Wishlist (許願池) =====
  wishlist: router({
    submit: publicProcedure.input(z.object({
      subject: z.string().min(1).max(200),
      content: z.string().min(1).max(5000),
      email: z.string().email().optional(),
    })).mutation(async ({ input }) => {
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_APP_PASSWORD;

      if (!gmailUser || !gmailPass) {
        throw new Error("郵件服務未設定，請聯繫管理員。");
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">AI好物誌 - 許願池新建議</h2>
          <hr style="border: 1px solid #e5e7eb;" />
          <p><strong>主旨：</strong>${input.subject}</p>
          ${input.email ? `<p><strong>聯絡信箱：</strong>${input.email}</p>` : ""}
          <p><strong>內容：</strong></p>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${input.content}</div>
          <hr style="border: 1px solid #e5e7eb; margin-top: 24px;" />
          <p style="color: #9ca3af; font-size: 12px;">此郵件由 AI好物誌 許願池系統自動發送</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"AI好物誌" <${gmailUser}>`,
        to: "marshalvision.co@gmail.com",
        subject: `[AI好物誌 許願池] ${input.subject}`,
        html: htmlContent,
      });

      // Also notify owner via built-in notification as backup
      try {
        await notifyOwner({
          title: `[許願池] ${input.subject}`,
          content: `主旨：${input.subject}\n${input.email ? `聯絡信箱：${input.email}\n` : ""}\n內容：\n${input.content}`,
        });
      } catch (_) { /* backup notification, ignore errors */ }

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
