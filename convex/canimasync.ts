import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper to generate 4-char code
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to shuffle array (generic, type-safe)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Don't mutate original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 1. Create a Room (with collision-safe code generation)
export const createRoom = mutation({
  args: { 
    hostName: v.string(),
    genres: v.array(v.number()),
    providers: v.optional(v.array(v.string())),
    mediaType: v.union(v.literal("movie"), v.literal("tv"))
  },
  handler: async (ctx, args) => {
    // Generate unique room code with collision retry (#4)
    let roomId = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateRoomCode();
      const existing = await ctx.db
        .query("matchRooms")
        .withIndex("by_roomId", (q) => q.eq("roomId", candidate))
        .first();
      if (!existing) {
        roomId = candidate;
        break;
      }
    }
    if (!roomId) {
      throw new Error("Failed to generate unique room code. Please try again.");
    }

    // Store room
    await ctx.db.insert("matchRooms", {
      roomId,
      status: "waiting",
      genres: args.genres,
      providers: args.providers,
      mediaType: args.mediaType,
      moviePool: [],
      createdAt: Date.now(),
    });

    // Add host as participant
    const userId = "host-" + crypto.randomUUID();
    await ctx.db.insert("matchParticipants", {
      roomId,
      userId,
      name: args.hostName,
      isHost: true,
      joinedAt: Date.now(),
    });

    return { roomId, userId };
  },
});

// 2. Join a Room
export const joinRoom = mutation({
  args: { 
    roomId: v.string(),
    userName: v.string() 
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("matchRooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) throw new Error("Room not found");
    if (room.status !== "waiting") throw new Error("Game already started");

    const userId = "user-" + crypto.randomUUID();
    await ctx.db.insert("matchParticipants", {
      roomId: args.roomId,
      userId,
      name: args.userName,
      isHost: false,
      joinedAt: Date.now(),
    });

    return { userId, genres: room.genres };
  },
});

// 3. Get Room Status (reactive subscription via Convex query)
export const getRoomState = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("matchRooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();
    
    if (!room) return null;

    const participants = await ctx.db
      .query("matchParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const votes = await ctx.db
      .query("matchVotes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return { 
      status: room.status, 
      participants, 
      moviePool: room.moviePool,
      matches: room.matches || [],
      votes,
      mediaType: room.mediaType,
      providers: room.providers,
      genres: room.genres
    };
  },
});

// 4. Start Session — Populate Movies from TMDB (server-side)
export const generateMoviePool = action({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.runQuery(api.canimasync.getRoomState, { roomId: args.roomId });
    if (!room) throw new Error("Room not found");

    const genres = room.genres || [];
    const mediaType = room.mediaType || "movie";
    const providers = room.providers || [];
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      // Set room to failed status so users get feedback (#10)
      await ctx.runMutation(api.canimasync.setRoomFailed, { roomId: args.roomId });
      throw new Error("TMDB_API_KEY environment variable is not set");
    }

    const genreString = genres.length > 0 ? `&with_genres=${genres.join("|")}` : "";
    const providerString = providers.length > 0 ? `&with_watch_providers=${providers.join("|")}&watch_region=IN` : "";
    
    // Randomize page offset (1-20)
    const startPage = Math.floor(Math.random() * 20) + 1;
    const pagesToFetch = 3; // Fetch ~60 movies

    try {
      const promises = [];
      for (let i = 0; i < pagesToFetch; i++) {
        const page = startPage + i;
        const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}${genreString}${providerString}&sort_by=popularity.desc&page=${page}`;
        promises.push(fetch(url).then(r => r.json()));
      }

      const results = await Promise.all(promises);
      let allMovieIds: number[] = [];
      results.forEach(data => {
        if (data.results) {
          allMovieIds.push(...data.results.map((m: { id: number }) => m.id));
        }
      });

      const shuffledIds = shuffleArray(allMovieIds);
      const finalPool = shuffledIds.slice(0, 60);

      if (finalPool.length === 0) {
        await ctx.runMutation(api.canimasync.setRoomFailed, { roomId: args.roomId });
        throw new Error("No movies found for the selected filters. Try different genres/providers.");
      }

      await ctx.runMutation(api.canimasync.setRoomActive, { 
        roomId: args.roomId, 
        movieIds: finalPool 
      });
    } catch (err) {
      console.error("generateMoviePool failed:", err);
      // If it wasn't already set to failed, set it now
      try {
        await ctx.runMutation(api.canimasync.setRoomFailed, { roomId: args.roomId });
      } catch { /* already failed */ }
      throw err; // Re-throw so client gets the error (#10)
    }
  }
});

export const setRoomActive = mutation({
  args: { roomId: v.string(), movieIds: v.array(v.number()) },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("matchRooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();
    
    if (!room) return;
    
    await ctx.db.patch(room._id, {
      status: "voting",
      moviePool: args.movieIds,
      matches: []
    });
  }
});

// Set room to failed status (for error handling)
export const setRoomFailed = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("matchRooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();
    if (room) {
      await ctx.db.patch(room._id, { status: "failed" });
    }
  }
});

// 5. Submit Vote & Check Match (with deduplication — #3)
export const submitVote = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    tmdbId: v.number(),
    vote: v.union(v.literal("like"), v.literal("dislike")),
    movieDetails: v.optional(v.object({
      title: v.string(),
      posterPath: v.optional(v.string()),
      releaseDate: v.optional(v.string())
    }))
  },
  handler: async (ctx, args) => {
    // --- Deduplication check (#3) ---
    const existingVote = await ctx.db
      .query("matchVotes")
      .withIndex("by_room_movie", (q) => q.eq("roomId", args.roomId).eq("tmdbId", args.tmdbId))
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingVote) {
      // Already voted on this movie — silently ignore
      return;
    }

    // Record vote
    await ctx.db.insert("matchVotes", {
      roomId: args.roomId,
      userId: args.userId,
      tmdbId: args.tmdbId,
      vote: args.vote
    });

    if (args.vote === "dislike") return;

    // Check for MATCH — only among participants who existed when voting started
    const participants = await ctx.db
      .query("matchParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const likes = await ctx.db
      .query("matchVotes")
      .withIndex("by_room_movie", (q) => q.eq("roomId", args.roomId).eq("tmdbId", args.tmdbId))
      .filter(q => q.eq(q.field("vote"), "like"))
      .collect();
    
    // If number of likes == number of participants → MATCH!
    if (likes.length === participants.length) {
      const room = await ctx.db
        .query("matchRooms")
        .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
        .first();
          
      if (room) {
        const newMatch = {
          tmdbId: args.tmdbId,
          title: args.movieDetails?.title || "Unknown",
          posterPath: args.movieDetails?.posterPath,
          releaseDate: args.movieDetails?.releaseDate
        };

        const existingMatches = room.matches || [];
        // Avoid duplicates
        if (!existingMatches.find(m => m.tmdbId === args.tmdbId)) {
          await ctx.db.patch(room._id, {
            matches: [...existingMatches, newMatch]
          });
        }
      }
    }
  }
});

// 6. Finish Session (Force Match View)
export const finishSession = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("matchRooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();
    
    if (room) {
      await ctx.db.patch(room._id, {
        status: "matched"
      });
    }
  }
});

// 7. Hydrate Movie IDs into Full Details (server-side — fixes #1, #2)
export const hydrateMovies = action({
  args: { 
    tmdbIds: v.array(v.number()),
    mediaType: v.optional(v.union(v.literal("movie"), v.literal("tv")))
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      throw new Error("TMDB_API_KEY environment variable is not set");
    }

    const type = args.mediaType || "movie";
    const results: any[] = [];

    // Batch in groups of 20 to avoid overwhelming TMDB
    for (let i = 0; i < args.tmdbIds.length; i += 20) {
      const batch = args.tmdbIds.slice(i, i + 20);
      const promises = batch.map(id =>
        fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&append_to_response=videos,credits,watch/providers`)
          .then(r => r.json())
          .catch(() => null) // Skip individual failures
      );
      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter(Boolean));
    }

    return results.map((m: any) => ({
      tmdbId: m.id,
      title: m.title || m.name,
      posterPath: m.poster_path,
      backdropPath: m.backdrop_path,
      overview: m.overview,
      voteAverage: m.vote_average,
      releaseDate: m.release_date || m.first_air_date,
      genres: m.genres?.map((g: any) => g.name).slice(0, 3) || [],
      videos: m.videos?.results || [],
      credits: m.credits,
      runtime: m.runtime || (m.episode_run_time ? m.episode_run_time[0] : null),
      mediaType: type,
      providers: m["watch/providers"]?.results?.IN?.flatrate || []
    }));
  }
});

// 8. Cleanup Old Rooms (#8) — call periodically or manually
export const cleanupOldRooms = mutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    // Find old rooms
    const oldRooms = await ctx.db
      .query("matchRooms")
      .filter(q => q.lt(q.field("createdAt"), cutoff))
      .collect();

    let deleted = 0;
    for (const room of oldRooms) {
      // Delete participants
      const participants = await ctx.db
        .query("matchParticipants")
        .withIndex("by_room", (q) => q.eq("roomId", room.roomId))
        .collect();
      for (const p of participants) {
        await ctx.db.delete(p._id);
      }

      // Delete votes
      const votes = await ctx.db
        .query("matchVotes")
        .withIndex("by_room", (q) => q.eq("roomId", room.roomId))
        .collect();
      for (const v of votes) {
        await ctx.db.delete(v._id);
      }

      // Delete room
      await ctx.db.delete(room._id);
      deleted++;
    }

    return { deletedRooms: deleted };
  }
});
