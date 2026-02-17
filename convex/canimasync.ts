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

// 1. Create a Room
export const createRoom = mutation({
  args: { 
    hostName: v.string(),
    genres: v.array(v.number()),
    providers: v.optional(v.array(v.string())),
    mediaType: v.union(v.literal("movie"), v.literal("tv"))
  },
  handler: async (ctx, args) => {
    const roomId = generateRoomCode();
    
    // Store room
    await ctx.db.insert("matchRooms", {
      roomId,
      status: "waiting",
      genres: args.genres,
      providers: args.providers,
      mediaType: args.mediaType,
      moviePool: [], // Will populate later
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
    // Check if room exists
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

// 3. Get Room Status (for polling/subscription)
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

// Helper to shuffle array
function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 4. Start Session (Populate Movies - Improved)
export const generateMoviePool = action({
    args: { roomId: v.string() },
    handler: async (ctx, args) => {
        const room = await ctx.runQuery(api.canimasync.getRoomState, { roomId: args.roomId });
        const genres = room?.genres || [];
        const mediaType = room?.mediaType || "movie";
        const providers = room?.providers || [];
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) {
            throw new Error("TMDB_API_KEY environment variable is not set");
        }

        const genreString = genres.length > 0 ? `&with_genres=${genres.join("|")}` : "";
        const providerString = providers.length > 0 ? `&with_watch_providers=${providers.join("|")}&watch_region=IN` : "";
        
        // Randomize page offset (1-20)
        const startPage = Math.floor(Math.random() * 20) + 1;
        const pagesToFetch = 3; // Fetch 60 movies
        
        let allMovieIds: number[] = [];

        try {
            const promises = [];
            for (let i = 0; i < pagesToFetch; i++) {
                const page = startPage + i;
                const url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}${genreString}${providerString}&sort_by=popularity.desc&page=${page}`;
                promises.push(fetch(url).then(r => r.json()));
            }

            const results = await Promise.all(promises);
            results.forEach(data => {
                if (data.results) {
                    allMovieIds.push(...data.results.map((m: any) => m.id));
                }
            });

            // Shuffle results
            const shuffledIds = shuffleArray(allMovieIds);
            
            // Limit to e.g. 50 to keep document size reasonable, or keep all 60
            const finalPool = shuffledIds.slice(0, 60);

            await ctx.runMutation(api.canimasync.setRoomActive, { 
                roomId: args.roomId, 
                movieIds: finalPool 
            });
        } catch (err) {
            console.error(err);
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
            matches: [] // Reset matches on new game
        });
    }
});

// 5. Submit Vote & Check Match (Multi-Match Support)
export const submitVote = mutation({
    args: {
        roomId: v.string(),
        userId: v.string(),
        tmdbId: v.number(),
        vote: v.union(v.literal("like"), v.literal("dislike")),
        movieDetails: v.optional(v.object({
            title: v.string(),
            posterPath: v.optional(v.string()), // Made optional in schema too
            releaseDate: v.optional(v.string())
        }))
    },
    handler: async (ctx, args) => {
        // Record vote
        await ctx.db.insert("matchVotes", {
            roomId: args.roomId,
            userId: args.userId,
            tmdbId: args.tmdbId,
            vote: args.vote
        });

        if (args.vote === "dislike") return;

        // Check for MATCH
        const participants = await ctx.db
            .query("matchParticipants")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();
        
        const likes = await ctx.db
            .query("matchVotes")
            .withIndex("by_room_movie", (q) => q.eq("roomId", args.roomId).eq("tmdbId", args.tmdbId))
            .filter(q => q.eq(q.field("vote"), "like"))
            .collect();
        
        // If number of likes == number of participants
        if (likes.length === participants.length) {
            // MATCH FOUND!
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

                // Push to matches array logic
                const existingMatches = room.matches || [];
                // Avoid duplicates (though unlikely with voting logic, possible with concurrent reqs)
                if (!existingMatches.find(m => m.tmdbId === args.tmdbId)) {
                    await ctx.db.patch(room._id, {
                        // We DO NOT change status to "matched" to allow game to continue
                        // OR we leave status as "voting" and client handles the match notification
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
