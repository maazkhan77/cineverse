import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get a user's profile by ID
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    // Get user info from auth table for name/email fallback
    const user = await ctx.db.get(args.userId);

    return {
      ...profile,
      // Fallback to auth user data if profile data missing
      displayName: profile?.displayName || user?.name || "Movie fan",
      avatarUrl: profile?.avatarUrl || user?.image,
    };
  },
});

// Get the current authenticated user's profile
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const user = await ctx.db.get(userId);

    return {
      userId,
      email: user?.email,
      displayName: profile?.displayName || user?.name,
      bio: profile?.bio,
      avatarUrl: profile?.avatarUrl || user?.image,
      favoriteGenres: profile?.favoriteGenres || [],
      preferredLanguage: profile?.preferredLanguage || "en",
      country: profile?.country,
      isProfilePublic: profile?.isProfilePublic ?? true, // Default to public
      createdAt: profile?.createdAt || Date.now(),
    };
  },
});

// Update the current user's profile
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    favoriteGenres: v.optional(v.array(v.string())),
    preferredLanguage: v.optional(v.string()),
    country: v.optional(v.string()),
    isProfilePublic: v.optional(v.boolean()),
    // We handle avatar separately via storage
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const timestamp = Date.now();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        ...args,
        updatedAt: timestamp,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        ...args,
        isProfilePublic: args.isProfilePublic ?? true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  },
});

// Generate URL for uploading avatar
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});

// Save the avatar storage ID to profile
export const updateAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Failed to get storage URL");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const timestamp = Date.now();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        avatarUrl: url,
        updatedAt: timestamp,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        avatarUrl: url,
        isProfilePublic: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  },
});
