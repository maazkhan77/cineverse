import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  watchlist: defineTable({
    userId: v.id("users"),
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.string()),
    voteAverage: v.optional(v.number()),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_tmdb", ["userId", "tmdbId"]),

  aiSearchHistory: defineTable({
    userId: v.id("users"),
    query: v.string(),
    results: v.array(
      v.object({
        tmdbId: v.number(),
        title: v.string(),
        reason: v.string(),
      })
    ),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // User Ratings - Our own rating system
  userRatings: defineTable({
    userId: v.id("users"),
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    rating: v.number(), // 1-10 scale
    review: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_content", ["tmdbId", "mediaType"])
    .index("by_user_and_content", ["userId", "tmdbId", "mediaType"]),

  // Community Rating Aggregates (cached)
  communityRatings: defineTable({
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    averageRating: v.number(),
    totalRatings: v.number(),
    distribution: v.object({
      rating1: v.number(),
      rating2: v.number(),
      rating3: v.number(),
      rating4: v.number(),
      rating5: v.number(),
      rating6: v.number(),
      rating7: v.number(),
      rating8: v.number(),
      rating9: v.number(),
      rating10: v.number(),
    }),
    lastUpdated: v.number(),
  }).index("by_content", ["tmdbId", "mediaType"]),

  // Enriched Content Cache (OMDB + TMDB merged)
  contentCache: defineTable({
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    imdbId: v.optional(v.string()),
    enrichedData: v.optional(v.object({
      rottenTomatoes: v.optional(v.number()),
      metacritic: v.optional(v.number()),
      imdbRating: v.optional(v.number()),
      awards: v.optional(v.string()),
      boxOffice: v.optional(v.string()),
      rated: v.optional(v.string()),
      runtime: v.optional(v.string()),
      plot: v.optional(v.string()),
    })),
    trailerKey: v.optional(v.string()),
    lastUpdated: v.number(),
  }).index("by_content", ["tmdbId", "mediaType"]),

  // Custom User Lists (beyond watchlist)
  userLists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    emoji: v.optional(v.string()), // List icon
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  // Items in user lists
  listItems: defineTable({
    listId: v.id("userLists"),
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.string()),
    addedAt: v.number(),
    order: v.number(), // For drag/drop reordering
  })
    .index("by_list", ["listId"])
    .index("by_content", ["tmdbId", "mediaType"]),

  // Content Statistics (trending, popular)
  contentStats: defineTable({
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    views: v.number(),           // Detail page views
    watchlistAdds: v.number(),   // Added to watchlist count
    searchHits: v.number(),      // Times appeared in search
    lastUpdated: v.number(),
  }).index("by_content", ["tmdbId", "mediaType"]),

  // Recent Searches (for autocomplete)
  recentSearches: defineTable({
    userId: v.id("users"),
    query: v.string(),
    resultCount: v.number(),
    searchedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_time", ["userId", "searchedAt"]),

  // Popular Searches (global)
  popularSearches: defineTable({
    query: v.string(),
    count: v.number(),
    lastSearched: v.number(),
  }).index("by_count", ["count"]),

  // User Profiles
  userProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()), // URL to uploaded image
    favoriteGenres: v.optional(v.array(v.string())),
    preferredLanguage: v.optional(v.string()),
    country: v.optional(v.string()),
    isProfilePublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // CanimaSync Rooms
  matchRooms: defineTable({
    roomId: v.string(), // 4-char code
    hostId: v.optional(v.id("users")), // Optional because user might not be logged in? For now lets say host is optional or we use a session ID
    status: v.union(v.literal("waiting"), v.literal("voting"), v.literal("matched")),
    genres: v.array(v.number()),
    providers: v.optional(v.array(v.string())), // TMDB Provider IDs
    mediaType: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    moviePool: v.array(v.number()), // TMDB IDs
    matches: v.optional(v.array(v.object({
      tmdbId: v.number(),
      title: v.string(),
      posterPath: v.optional(v.string()),
      releaseDate: v.optional(v.string())
    }))),
    // Deprecated: Legacy field from MatchPoint, keeping for schema validation
    currentMatch: v.optional(v.object({
        tmdbId: v.number(),
        title: v.string(),
        posterPath: v.optional(v.string()),
        releaseDate: v.optional(v.string())
    })),
    createdAt: v.number(),
  }).index("by_roomId", ["roomId"]),

  // CanimaSync Participants
  matchParticipants: defineTable({
    roomId: v.string(),
    userId: v.optional(v.string()), // Can be Convex ID or a generated session ID
    name: v.string(),
    isHost: v.boolean(),
    joinedAt: v.number(),
  }).index("by_room", ["roomId"]),

  // CanimaSync Votes
  matchVotes: defineTable({
    roomId: v.string(),
    userId: v.string(),
    tmdbId: v.number(),
    vote: v.union(v.literal("like"), v.literal("dislike")),
  })
    .index("by_room_movie", ["roomId", "tmdbId"])
    .index("by_room_user", ["roomId", "userId"])
    .index("by_room", ["roomId"]), // For fetching all votes in a room
});

