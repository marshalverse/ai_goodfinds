import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, uniqueIndex, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * AI tools categories
 */
export const aiTools = mysqlTable("ai_tools", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  iconUrl: text("iconUrl"),
  category: mysqlEnum("category", ["llm", "image", "audio", "video", "code", "other"]).default("other").notNull(),
  color: varchar("color", { length: 20 }).default("#6366f1"),
  postCount: int("postCount").default(0).notNull(),
  memberCount: int("memberCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiTool = typeof aiTools.$inferSelect;
export type InsertAiTool = typeof aiTools.$inferInsert;

/**
 * Tags for posts
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  color: varchar("color", { length: 20 }).default("#8b5cf6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Posts / articles
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  toolId: int("toolId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  postType: mysqlEnum("postType", ["article", "prompt", "tutorial", "question", "comparison"]).default("article").notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  bookmarkCount: int("bookmarkCount").default(0).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("posts_authorId_idx").on(table.authorId),
  index("posts_toolId_idx").on(table.toolId),
  index("posts_createdAt_idx").on(table.createdAt),
]);

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Post-tag many-to-many relation
 */
export const postTags = mysqlTable("post_tags", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  tagId: int("tagId").notNull(),
}, (table) => [
  uniqueIndex("post_tags_unique").on(table.postId, table.tagId),
]);

export type PostTag = typeof postTags.$inferSelect;

/**
 * Comments on posts
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  authorId: int("authorId").notNull(),
  parentId: int("parentId"),
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("comments_postId_idx").on(table.postId),
  index("comments_authorId_idx").on(table.authorId),
]);

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Likes on posts and comments
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId"),
  commentId: int("commentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("likes_user_post_unique").on(table.userId, table.postId),
  uniqueIndex("likes_user_comment_unique").on(table.userId, table.commentId),
]);

export type Like = typeof likes.$inferSelect;

/**
 * Bookmarks / saved posts
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("bookmarks_user_post_unique").on(table.userId, table.postId),
]);

export type Bookmark = typeof bookmarks.$inferSelect;

/**
 * User tool preferences (which AI tools a user is interested in)
 */
export const userToolPreferences = mysqlTable("user_tool_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  toolId: int("toolId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_tool_pref_unique").on(table.userId, table.toolId),
]);

export type UserToolPreference = typeof userToolPreferences.$inferSelect;
