import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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
