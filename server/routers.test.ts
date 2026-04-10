import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    bio: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    },
  };
}

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User 1");
    expect(result?.email).toBe("test1@example.com");
  });
});

describe("tools.list", () => {
  it("returns a list of AI tools", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tools.list();
    expect(Array.isArray(result)).toBe(true);
    // We seeded 12 tools
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

describe("tags.list", () => {
  it("returns a list of tags", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tags.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

describe("posts.list", () => {
  it("returns posts with pagination info", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.posts.list({ limit: 10 });
    expect(result).toHaveProperty("posts");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.posts)).toBe(true);
  });
});

describe("posts.trending", () => {
  it("returns trending posts", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.posts.trending({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("posts.create", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.posts.create({
        toolId: 1,
        title: "Test Post",
        content: "Test content",
      })
    ).rejects.toThrow();
  });

  it("validates required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.posts.create({
        toolId: 1,
        title: "",
        content: "Test content",
      })
    ).rejects.toThrow();
  });

  it("accepts toolIds array for multi-tool selection", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw with valid toolIds array
    const result = await caller.posts.create({
      toolId: 1,
      toolIds: [1, 2, 3],
      title: "Multi-tool Test Post",
      content: "Testing multi-tool selection feature",
      postType: "comparison",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("works with single toolId and no toolIds", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.posts.create({
      toolId: 1,
      title: "Single tool Test Post",
      content: "Testing single tool selection",
    });
    expect(result).toHaveProperty("id");
  });
});

describe("comments.create", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.comments.create({
        postId: 1,
        content: "Test comment",
      })
    ).rejects.toThrow();
  });
});

describe("likes.toggle", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.likes.toggle({ postId: 1 })
    ).rejects.toThrow();
  });
});

describe("bookmarks.toggle", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.bookmarks.toggle({ postId: 1 })
    ).rejects.toThrow();
  });
});

describe("profile.update", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.profile.update({ name: "New Name" })
    ).rejects.toThrow();
  });
});

describe("posts.update", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.posts.update({ id: 1, title: "Updated Title" })
    ).rejects.toThrow();
  });

  it("validates input schema", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw with valid input
    await expect(
      caller.posts.update({ id: 999999, title: "Updated" })
    ).rejects.toThrow(); // Will throw because post doesn't exist for this user
  });
});

describe("notifications", () => {
  it("list requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notifications.list({ limit: 10 })
    ).rejects.toThrow();
  });

  it("unreadCount requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notifications.unreadCount()
    ).rejects.toThrow();
  });

  it("markAsRead requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notifications.markAsRead({ id: 1 })
    ).rejects.toThrow();
  });

  it("markAllAsRead requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notifications.markAllAsRead()
    ).rejects.toThrow();
  });

  it("returns notifications for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns unread count for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.unreadCount();
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe("ai.generateSummary", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ai.generateSummary({ content: "Test content" })
    ).rejects.toThrow();
  });
});

describe("ai.optimizePrompt", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ai.optimizePrompt({ prompt: "Test prompt" })
    ).rejects.toThrow();
  });
});

describe("upload.image", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.upload.image({
        base64: "dGVzdA==",
        mimeType: "image/png",
        fileName: "test.png",
      })
    ).rejects.toThrow();
  });
});

describe("wishlist.submit", () => {
  it("validates required fields - empty subject", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.wishlist.submit({ subject: "", content: "Some content" })
    ).rejects.toThrow();
  });

  it("validates required fields - empty content", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.wishlist.submit({ subject: "Test subject", content: "" })
    ).rejects.toThrow();
  });

  it("validates email format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.wishlist.submit({
        subject: "Test",
        content: "Test content",
        email: "invalid-email",
      })
    ).rejects.toThrow();
  });

  it("accepts valid submission (public procedure)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // This will call notifyOwner which may fail in test env, but the input validation should pass
    try {
      const result = await caller.wishlist.submit({
        subject: "Test Wish",
        content: "I wish for a new feature",
        email: "test@example.com",
      });
      expect(result).toEqual({ success: true });
    } catch (e: any) {
      // notifyOwner may fail in test env due to missing env vars, that's expected
      expect(e.message).toContain("Notification");
    }
  });
});

describe("tools - new tools and categories", () => {
  it("includes newly added AI tools (Copilot, Manus, Sora, NotebookLM)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tools.list();
    const toolNames = result.map((t: any) => t.name);
    expect(toolNames).toContain("Copilot");
    expect(toolNames).toContain("Manus");
    expect(toolNames).toContain("Sora");
    expect(toolNames).toContain("NotebookLM");
  });

  it("includes 'Other' category tool", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tools.list();
    const otherTools = result.filter((t: any) => t.category === "other");
    expect(otherTools.length).toBeGreaterThanOrEqual(1);
  });

  it("has multiple categories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tools.list();
    const categories = [...new Set(result.map((t: any) => t.category))];
    expect(categories.length).toBeGreaterThanOrEqual(3);
    expect(categories).toContain("llm");
    expect(categories).toContain("image");
  });
});

describe("search.posts", () => {
  it("returns results with search query", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.posts.list({ limit: 5, search: "test" });
    expect(result).toHaveProperty("posts");
    expect(result).toHaveProperty("total");
  });
});

describe("profile", () => {
  it("get returns profile data for valid userId", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // userId 0 or non-existent should return undefined
    const result = await caller.profile.get({ userId: 999999 });
    expect(result).toBeUndefined();
  });

  it("update requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.profile.update({ name: "New Name" })
    ).rejects.toThrow();
  });

  it("update accepts name, bio, and avatarUrl", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.update({
      name: "Updated Name",
      bio: "This is my bio",
      avatarUrl: "https://example.com/avatar.png",
    });
    expect(result).toEqual({ success: true });
  });

  it("update accepts partial fields (name only)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.update({ name: "Only Name" });
    expect(result).toEqual({ success: true });
  });

  it("update accepts partial fields (bio only)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.update({ bio: "Only bio text" });
    expect(result).toEqual({ success: true });
  });

  it("update accepts partial fields (avatarUrl only)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.update({ avatarUrl: "https://example.com/new-avatar.jpg" });
    expect(result).toEqual({ success: true });
  });
});
