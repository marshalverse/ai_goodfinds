import { eq, and, desc, asc, sql, like, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, aiTools, posts, comments, likes, bookmarks, tags, postTags, postTools, userToolPreferences, notifications,
  type AiTool, type Post, type Comment, type Tag, type InsertNotification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== AI Tools =====
export async function getAllTools() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiTools).orderBy(asc(aiTools.name));
}

export async function getToolBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiTools).where(eq(aiTools.slug, slug)).limit(1);
  return result[0];
}

export async function getToolById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiTools).where(eq(aiTools.id, id)).limit(1);
  return result[0];
}

// ===== Tags =====
export async function getAllTags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tags).orderBy(asc(tags.name));
}

// ===== Posts =====
export async function createPost(data: {
  authorId: number; toolId: number; toolIds?: number[]; title: string; content: string;
  summary?: string; postType?: string; tagIds?: number[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(posts).values({
    authorId: data.authorId,
    toolId: data.toolId,
    title: data.title,
    content: data.content,
    summary: data.summary || null,
    postType: (data.postType as any) || "article",
  });
  const postId = result.insertId;
  // Insert post-tool associations
  const allToolIds = data.toolIds && data.toolIds.length > 0 ? data.toolIds : [data.toolId];
  await db.insert(postTools).values(allToolIds.map(toolId => ({ postId, toolId })));
  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(postTags).values(data.tagIds.map(tagId => ({ postId, tagId })));
  }
  // Increment tool post count for all associated tools
  for (const tid of allToolIds) {
    await db.update(aiTools).set({ postCount: sql`${aiTools.postCount} + 1` }).where(eq(aiTools.id, tid));
  }
  return postId;
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!result[0]) return undefined;
  // Increment view count
  await db.update(posts).set({ viewCount: sql`${posts.viewCount} + 1` }).where(eq(posts.id, id));
  // Get author info
  const author = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, result[0].authorId)).limit(1);
  // Get primary tool info
  const tool = await db.select().from(aiTools).where(eq(aiTools.id, result[0].toolId)).limit(1);
  // Get all associated tools
  const ptoolRows = await db.select({ toolId: postTools.toolId }).from(postTools).where(eq(postTools.postId, id));
  let allTools: any[] = [];
  if (ptoolRows.length > 0) {
    allTools = await db.select({ id: aiTools.id, name: aiTools.name, slug: aiTools.slug, color: aiTools.color }).from(aiTools).where(inArray(aiTools.id, ptoolRows.map(pt => pt.toolId)));
  } else {
    allTools = tool.length > 0 ? [{ id: tool[0].id, name: tool[0].name, slug: tool[0].slug, color: tool[0].color }] : [];
  }
  // Get tags
  const postTagRows = await db.select({ tagId: postTags.tagId }).from(postTags).where(eq(postTags.postId, id));
  let postTagList: Tag[] = [];
  if (postTagRows.length > 0) {
    postTagList = await db.select().from(tags).where(inArray(tags.id, postTagRows.map(pt => pt.tagId)));
  }
  return { ...result[0], viewCount: result[0].viewCount + 1, author: author[0], tool: tool[0], tools: allTools, tags: postTagList };
}

export async function getPosts(params: {
  toolId?: number; tagId?: number; postType?: string;
  search?: string; sortBy?: string; page?: number; limit?: number;
}) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let conditions: any[] = [eq(posts.isPublished, true)];
  if (params.toolId) conditions.push(eq(posts.toolId, params.toolId));
  if (params.postType) conditions.push(eq(posts.postType, params.postType as any));
  if (params.search) {
    conditions.push(or(like(posts.title, `%${params.search}%`), like(posts.content, `%${params.search}%`)));
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  let orderClause;
  switch (params.sortBy) {
    case "popular": orderClause = desc(posts.likeCount); break;
    case "views": orderClause = desc(posts.viewCount); break;
    case "comments": orderClause = desc(posts.commentCount); break;
    default: orderClause = desc(posts.createdAt);
  }

  // If filtering by tag, join postTags
  let postRows;
  if (params.tagId) {
    postRows = await db.select({ post: posts })
      .from(posts)
      .innerJoin(postTags, and(eq(postTags.postId, posts.id), eq(postTags.tagId, params.tagId)))
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);
    postRows = postRows.map(r => r.post);
  } else {
    postRows = await db.select().from(posts).where(whereClause).orderBy(orderClause).limit(limit).offset(offset);
  }

  // Count total
  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(posts).where(whereClause);
  const total = countResult?.count || 0;

  // Enrich with author & tool info
  const enriched = await Promise.all(postRows.map(async (post) => {
    const author = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, post.authorId)).limit(1);
    const tool = await db.select({ id: aiTools.id, name: aiTools.name, slug: aiTools.slug, color: aiTools.color }).from(aiTools).where(eq(aiTools.id, post.toolId)).limit(1);
    // Get all associated tools
    const ptoolRows = await db.select({ toolId: postTools.toolId }).from(postTools).where(eq(postTools.postId, post.id));
    let allTools: any[] = [];
    if (ptoolRows.length > 0) {
      allTools = await db.select({ id: aiTools.id, name: aiTools.name, slug: aiTools.slug, color: aiTools.color }).from(aiTools).where(inArray(aiTools.id, ptoolRows.map(pt => pt.toolId)));
    } else {
      allTools = tool.length > 0 ? [tool[0]] : [];
    }
    const ptRows = await db.select({ tagId: postTags.tagId }).from(postTags).where(eq(postTags.postId, post.id));
    let postTagList: any[] = [];
    if (ptRows.length > 0) {
      postTagList = await db.select().from(tags).where(inArray(tags.id, ptRows.map(pt => pt.tagId)));
    }
    return { ...post, author: author[0], tool: tool[0], tools: allTools, tags: postTagList };
  }));

  return { posts: enriched, total };
}

export async function getTrendingPosts(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(posts)
    .where(eq(posts.isPublished, true))
    .orderBy(desc(posts.likeCount))
    .limit(limit);
  const enriched = await Promise.all(rows.map(async (post) => {
    const author = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, post.authorId)).limit(1);
    const tool = await db.select({ id: aiTools.id, name: aiTools.name, slug: aiTools.slug, color: aiTools.color }).from(aiTools).where(eq(aiTools.id, post.toolId)).limit(1);
    return { ...post, author: author[0], tool: tool[0] };
  }));
  return enriched;
}

export async function deletePost(postId: number, authorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const post = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.authorId, authorId))).limit(1);
  if (!post[0]) throw new Error("Post not found or unauthorized");
  await db.delete(postTags).where(eq(postTags.postId, postId));
  await db.delete(comments).where(eq(comments.postId, postId));
  await db.delete(likes).where(eq(likes.postId, postId));
  await db.delete(bookmarks).where(eq(bookmarks.postId, postId));
  await db.delete(posts).where(eq(posts.id, postId));
  await db.update(aiTools).set({ postCount: sql`GREATEST(${aiTools.postCount} - 1, 0)` }).where(eq(aiTools.id, post[0].toolId));
}

// ===== Comments =====
export async function createComment(data: { postId: number; authorId: number; content: string; parentId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(comments).values({
    postId: data.postId, authorId: data.authorId, content: data.content, parentId: data.parentId || null,
  });
  await db.update(posts).set({ commentCount: sql`${posts.commentCount} + 1` }).where(eq(posts.id, data.postId));
  return result.insertId;
}

export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(asc(comments.createdAt));
  const enriched = await Promise.all(rows.map(async (comment) => {
    const author = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, comment.authorId)).limit(1);
    return { ...comment, author: author[0] };
  }));
  return enriched;
}

export async function deleteComment(commentId: number, authorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const comment = await db.select().from(comments).where(and(eq(comments.id, commentId), eq(comments.authorId, authorId))).limit(1);
  if (!comment[0]) throw new Error("Comment not found or unauthorized");
  await db.delete(comments).where(eq(comments.id, commentId));
  await db.update(posts).set({ commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)` }).where(eq(posts.id, comment[0].postId));
}

// ===== Likes =====
export async function toggleLike(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId))).limit(1);
  if (existing[0]) {
    await db.delete(likes).where(eq(likes.id, existing[0].id));
    await db.update(posts).set({ likeCount: sql`GREATEST(${posts.likeCount} - 1, 0)` }).where(eq(posts.id, postId));
    return false;
  } else {
    await db.insert(likes).values({ userId, postId });
    await db.update(posts).set({ likeCount: sql`${posts.likeCount} + 1` }).where(eq(posts.id, postId));
    return true;
  }
}

export async function getUserLikedPostIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ postId: likes.postId }).from(likes).where(eq(likes.userId, userId));
  return rows.map(r => r.postId).filter(Boolean) as number[];
}

// ===== Bookmarks =====
export async function toggleBookmark(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId))).limit(1);
  if (existing[0]) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
    await db.update(posts).set({ bookmarkCount: sql`GREATEST(${posts.bookmarkCount} - 1, 0)` }).where(eq(posts.id, postId));
    return false;
  } else {
    await db.insert(bookmarks).values({ userId, postId });
    await db.update(posts).set({ bookmarkCount: sql`${posts.bookmarkCount} + 1` }).where(eq(posts.id, postId));
    return true;
  }
}

export async function getUserBookmarkedPostIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ postId: bookmarks.postId }).from(bookmarks).where(eq(bookmarks.userId, userId));
  return rows.map(r => r.postId);
}

export async function getUserBookmarkedPosts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ postId: bookmarks.postId }).from(bookmarks).where(eq(bookmarks.userId, userId));
  if (rows.length === 0) return [];
  const postIds = rows.map(r => r.postId);
  const postRows = await db.select().from(posts).where(inArray(posts.id, postIds)).orderBy(desc(posts.createdAt));
  const enriched = await Promise.all(postRows.map(async (post) => {
    const author = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, post.authorId)).limit(1);
    const tool = await db.select({ id: aiTools.id, name: aiTools.name, slug: aiTools.slug, color: aiTools.color }).from(aiTools).where(eq(aiTools.id, post.toolId)).limit(1);
    return { ...post, author: author[0], tool: tool[0] };
  }));
  return enriched;
}

// ===== User Profile =====
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) return undefined;
  const [postCountResult] = await db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.authorId, userId));
  const [totalLikesResult] = await db.select({ total: sql<number>`COALESCE(SUM(likeCount), 0)` }).from(posts).where(eq(posts.authorId, userId));
  const userPosts = await db.select().from(posts).where(eq(posts.authorId, userId)).orderBy(desc(posts.createdAt)).limit(20);
  // Get user tool preferences
  const prefs = await db.select({ toolId: userToolPreferences.toolId }).from(userToolPreferences).where(eq(userToolPreferences.userId, userId));
  let preferredTools: any[] = [];
  if (prefs.length > 0) {
    preferredTools = await db.select().from(aiTools).where(inArray(aiTools.id, prefs.map(p => p.toolId)));
  }
  const enrichedPosts = await Promise.all(userPosts.map(async (post) => {
    const tool = await db.select({ id: aiTools.id, name: aiTools.name, slug: aiTools.slug, color: aiTools.color }).from(aiTools).where(eq(aiTools.id, post.toolId)).limit(1);
    return { ...post, tool: tool[0] };
  }));
  return {
    ...user[0],
    postCount: postCountResult?.count || 0,
    totalLikes: totalLikesResult?.total || 0,
    posts: enrichedPosts,
    preferredTools,
  };
}

export async function updateUserProfile(userId: number, data: { name?: string; bio?: string; avatarUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }
}

export async function setUserToolPreferences(userId: number, toolIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userToolPreferences).where(eq(userToolPreferences.userId, userId));
  if (toolIds.length > 0) {
    await db.insert(userToolPreferences).values(toolIds.map(toolId => ({ userId, toolId })));
  }
}

// ===== User posts by author =====
export async function getPostsByAuthor(authorId: number, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };
  const offset = (page - 1) * limit;
  const rows = await db.select().from(posts).where(eq(posts.authorId, authorId)).orderBy(desc(posts.createdAt)).limit(limit).offset(offset);
  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.authorId, authorId));
  const enriched = await Promise.all(rows.map(async (post) => {
    const tool = await db.select({ id: aiTools.id, name: aiTools.name, slug: aiTools.slug, color: aiTools.color }).from(aiTools).where(eq(aiTools.id, post.toolId)).limit(1);
    return { ...post, tool: tool[0] };
  }));
  return { posts: enriched, total: countResult?.count || 0 };
}

// ===== Update Post =====
export async function updatePost(postId: number, authorId: number, data: {
  title?: string; content?: string; summary?: string;
  toolId?: number; toolIds?: number[]; postType?: string; tagIds?: number[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const post = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.authorId, authorId))).limit(1);
  if (!post[0]) throw new Error("Post not found or unauthorized");

  const updateData: Record<string, any> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.toolId !== undefined) updateData.toolId = data.toolId;
  if (data.postType !== undefined) updateData.postType = data.postType;

  if (Object.keys(updateData).length > 0) {
    await db.update(posts).set(updateData).where(eq(posts.id, postId));
  }

  // Update tool associations
  if (data.toolIds && data.toolIds.length > 0) {
    await db.delete(postTools).where(eq(postTools.postId, postId));
    await db.insert(postTools).values(data.toolIds.map(toolId => ({ postId, toolId })));
  }

  // Update tag associations
  if (data.tagIds !== undefined) {
    await db.delete(postTags).where(eq(postTags.postId, postId));
    if (data.tagIds.length > 0) {
      await db.insert(postTags).values(data.tagIds.map(tagId => ({ postId, tagId })));
    }
  }
}

// ===== Notifications =====
export async function createNotification(data: {
  userId: number; type: "like" | "comment" | "system";
  message: string; relatedPostId?: number; relatedUserId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(notifications).values({
      userId: data.userId,
      type: data.type,
      message: data.message,
      relatedPostId: data.relatedPostId || null,
      relatedUserId: data.relatedUserId || null,
    });
  } catch (error) {
    console.error("[Notification] Failed to create:", error);
  }
}

export async function getNotifications(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result?.count || 0;
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}
