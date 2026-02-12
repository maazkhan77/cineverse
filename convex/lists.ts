import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Custom User Lists
 * - Create/manage collections beyond watchlist
 * - "Favorites", "Watch in 2025", "Scary Movies", etc.
 */

// Create a new list
export const createList = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, { name, description, isPublic = false, emoji }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const now = Date.now();
    return ctx.db.insert("userLists", {
      userId,
      name,
      description,
      isPublic,
      emoji,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get user's lists
export const getUserLists = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const lists = await ctx.db
      .query("userLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get item count for each list
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        const items = await ctx.db
          .query("listItems")
          .withIndex("by_list", (q) => q.eq("listId", list._id))
          .collect();
        return { ...list, itemCount: items.length };
      })
    );

    return listsWithCounts;
  },
});

// Get a single list with its items
export const getList = query({
  args: { listId: v.id("userLists") },
  handler: async (ctx, { listId }) => {
    const list = await ctx.db.get(listId);
    if (!list) return null;

    // Check access
    const userId = await getAuthUserId(ctx);
    if (!list.isPublic && list.userId !== userId) {
      return null; // Private list, not owner
    }

    const items = await ctx.db
      .query("listItems")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();

    // Sort by order
    items.sort((a, b) => a.order - b.order);

    return { ...list, items };
  },
});

// Add item to list
export const addToList = mutation({
  args: {
    listId: v.id("userLists"),
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.string()),
  },
  handler: async (ctx, { listId, tmdbId, mediaType, title, posterPath }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Verify list ownership
    const list = await ctx.db.get(listId);
    if (!list || list.userId !== userId) {
      throw new Error("List not found or not authorized");
    }

    // Check if already in list
    const existing = await ctx.db
      .query("listItems")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .filter((q) => q.eq(q.field("tmdbId"), tmdbId))
      .first();

    if (existing) return existing._id;

    // Get max order
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) : 0;

    // Update list timestamp
    await ctx.db.patch(listId, { updatedAt: Date.now() });

    return ctx.db.insert("listItems", {
      listId,
      tmdbId,
      mediaType,
      title,
      posterPath,
      addedAt: Date.now(),
      order: maxOrder + 1,
    });
  },
});

// Remove item from list
export const removeFromList = mutation({
  args: {
    listId: v.id("userLists"),
    tmdbId: v.number(),
  },
  handler: async (ctx, { listId, tmdbId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const list = await ctx.db.get(listId);
    if (!list || list.userId !== userId) {
      throw new Error("Not authorized");
    }

    const item = await ctx.db
      .query("listItems")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .filter((q) => q.eq(q.field("tmdbId"), tmdbId))
      .first();

    if (item) {
      await ctx.db.delete(item._id);
      await ctx.db.patch(listId, { updatedAt: Date.now() });
    }
  },
});

// Reorder items in list
export const reorderList = mutation({
  args: {
    listId: v.id("userLists"),
    itemIds: v.array(v.id("listItems")),
  },
  handler: async (ctx, { listId, itemIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const list = await ctx.db.get(listId);
    if (!list || list.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Update order for each item
    await Promise.all(
      itemIds.map((itemId, index) =>
        ctx.db.patch(itemId, { order: index })
      )
    );

    await ctx.db.patch(listId, { updatedAt: Date.now() });
  },
});

// Delete a list
export const deleteList = mutation({
  args: { listId: v.id("userLists") },
  handler: async (ctx, { listId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const list = await ctx.db.get(listId);
    if (!list || list.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Delete all items first
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();

    await Promise.all(items.map((item) => ctx.db.delete(item._id)));
    await ctx.db.delete(listId);
  },
});

// Update list details
export const updateList = mutation({
  args: {
    listId: v.id("userLists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, { listId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const list = await ctx.db.get(listId);
    if (!list || list.userId !== userId) {
      throw new Error("Not authorized");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(listId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Get public lists (for discovery)
export const getPublicLists = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const lists = await ctx.db
      .query("userLists")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .take(limit);

    return Promise.all(
      lists.map(async (list) => {
        const items = await ctx.db
          .query("listItems")
          .withIndex("by_list", (q) => q.eq("listId", list._id))
          .take(4); // Preview first 4 items
        const user = await ctx.db.get(list.userId);
        return {
          ...list,
          previewItems: items,
          userName: user?.name || "Anonymous",
        };
      })
    );
  },
});
