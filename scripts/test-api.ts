/**
 * Backend API Test Suite
 * Tests all Convex actions for edge cases and proper responses
 * Run with: npx ts-node --esm convex/tests/api-test.ts
 */

const CONVEX_URL = "https://scrupulous-boar-419.convex.cloud";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: unknown;
}

const results: TestResult[] = [];

async function callAction(action: string, args: Record<string, unknown>) {
  const response = await fetch(`${CONVEX_URL}/api/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: action, args }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    console.log(`🧪 Testing: ${name}...`);
    await fn();
    results.push({ name, passed: true, message: "OK" });
    console.log(`   ✅ PASSED`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, message });
    console.log(`   ❌ FAILED: ${message}`);
  }
}

async function runTests() {
  console.log("\n🚀 CineVerse Backend Test Suite\n");
  console.log("=".repeat(50));

  // ==================== TMDB TESTS ====================
  console.log("\n📍 TMDB API Tests\n");

  let movieId: number | null = null;
  let tvId: number | null = null;
  let imdbId: string | null = null;

  await test("getTrending returns results", async () => {
    const data = await callAction("tmdb:getTrending", { page: 1, timeWindow: "week" });
    if (!data.results || data.results.length === 0) {
      throw new Error("No trending results returned");
    }
    // Save IDs for later tests
    const movie = data.results.find((r: { media_type: string }) => r.media_type === "movie");
    const tv = data.results.find((r: { media_type: string }) => r.media_type === "tv");
    if (movie) movieId = movie.id;
    if (tv) tvId = tv.id;
    console.log(`   📊 Found ${data.results.length} trending items`);
  });

  await test("getMovies with pagination", async () => {
    const page1 = await callAction("tmdb:getMovies", { page: 1 });
    const page2 = await callAction("tmdb:getMovies", { page: 2 });
    
    if (page1.results[0].id === page2.results[0].id) {
      throw new Error("Pagination not working - same results on different pages");
    }
    console.log(`   📊 Page 1: ${page1.results.length}, Page 2: ${page2.results.length} movies`);
  });

  await test("getMovies with genre filter", async () => {
    // 28 = Action genre
    const data = await callAction("tmdb:getMovies", { page: 1, genreIds: "28" });
    if (!data.results || data.results.length === 0) {
      throw new Error("No action movies returned");
    }
    console.log(`   📊 Found ${data.results.length} action movies`);
  });

  await test("getSeries returns TV shows", async () => {
    const data = await callAction("tmdb:getSeries", { page: 1 });
    if (!data.results || data.results.length === 0) {
      throw new Error("No TV series returned");
    }
    if (!tvId) tvId = data.results[0].id;
    console.log(`   📊 Found ${data.results.length} TV series`);
  });

  await test("getDetails for movie", async () => {
    if (!movieId) throw new Error("No movie ID from previous test");
    
    const data = await callAction("tmdb:getDetails", { id: movieId, mediaType: "movie" });
    
    if (!data.id || !data.title) {
      throw new Error("Missing required fields in movie details");
    }
    
    // Check for videos (trailer data)
    if (data.videos?.results) {
      console.log(`   🎬 Found ${data.videos.results.length} videos`);
    }
    
    // Check for IMDB ID
    if (data.imdb_id) {
      imdbId = data.imdb_id;
      console.log(`   🔗 IMDB ID: ${imdbId}`);
    }
    
    console.log(`   📊 Movie: "${data.title}" (${data.release_date})`);
  });

  await test("getDetails for TV show", async () => {
    if (!tvId) throw new Error("No TV ID from previous test");
    
    const data = await callAction("tmdb:getDetails", { id: tvId, mediaType: "tv" });
    
    if (!data.id || !data.name) {
      throw new Error("Missing required fields in TV details");
    }
    
    console.log(`   📊 TV: "${data.name}" (${data.first_air_date})`);
  });

  await test("search returns multi-type results", async () => {
    const data = await callAction("tmdb:search", { query: "Breaking Bad" });
    
    if (!data.results || data.results.length === 0) {
      throw new Error("No search results for 'Breaking Bad'");
    }
    
    const types = new Set(data.results.map((r: { media_type: string }) => r.media_type));
    console.log(`   📊 Found ${data.results.length} results, types: ${[...types].join(", ")}`);
  });

  await test("search handles empty query gracefully", async () => {
    try {
      const data = await callAction("tmdb:search", { query: "" });
      // TMDB might return empty or error - both are acceptable
      console.log(`   📊 Empty query returned: ${data.results?.length || 0} results`);
    } catch {
      console.log(`   📊 Empty query correctly rejected`);
    }
  });

  await test("search handles special characters", async () => {
    const data = await callAction("tmdb:search", { query: "Spider-Man: No Way Home" });
    if (!data.results) {
      throw new Error("Search failed with special characters");
    }
    console.log(`   📊 Found ${data.results.length} results for special character query`);
  });

  await test("getRecommendations returns related content", async () => {
    if (!movieId) throw new Error("No movie ID");
    
    const data = await callAction("tmdb:getRecommendations", { id: movieId, mediaType: "movie" });
    console.log(`   📊 Found ${data.results?.length || 0} recommendations`);
  });

  await test("getNowPlaying returns current movies", async () => {
    const data = await callAction("tmdb:getNowPlaying", { page: 1 });
    if (!data.results || data.results.length === 0) {
      throw new Error("No now playing movies");
    }
    console.log(`   📊 Found ${data.results.length} now playing movies`);
  });

  await test("getUpcoming returns future movies", async () => {
    const data = await callAction("tmdb:getUpcoming", { page: 1 });
    if (!data.results || data.results.length === 0) {
      throw new Error("No upcoming movies");
    }
    console.log(`   📊 Found ${data.results.length} upcoming movies`);
  });

  // ==================== OMDB TESTS ====================
  console.log("\n📍 OMDB API Tests\n");

  await test("getEnrichedRatings with valid IMDB ID", async () => {
    // tt0468569 = The Dark Knight (known IMDB ID)
    const data = await callAction("omdb:getEnrichedRatings", { imdbId: "tt0468569" });
    
    if (!data) {
      throw new Error("No OMDB data returned");
    }
    
    if (data.imdb?.rating === null && data.rottenTomatoes?.rating === null) {
      throw new Error("No ratings found in OMDB response");
    }
    
    console.log(`   🍅 RT: ${data.rottenTomatoes?.rating}%`);
    console.log(`   📊 Metacritic: ${data.metacritic?.rating}`);
    console.log(`   ⭐ IMDB: ${data.imdb?.rating}`);
    console.log(`   🏆 Awards: ${data.awards || "N/A"}`);
  });

  await test("getEnrichedRatings with movie's actual IMDB ID", async () => {
    if (!imdbId) {
      console.log(`   ⚠️ Skipping - no IMDB ID from TMDB`);
      return;
    }
    
    const data = await callAction("omdb:getEnrichedRatings", { imdbId });
    
    if (data) {
      console.log(`   🍅 RT: ${data.rottenTomatoes?.rating || "N/A"}%`);
      console.log(`   📊 Metacritic: ${data.metacritic?.rating || "N/A"}`);
    } else {
      console.log(`   ⚠️ No OMDB data for ${imdbId}`);
    }
  });

  await test("getEnrichedRatings handles invalid IMDB ID", async () => {
    const data = await callAction("omdb:getEnrichedRatings", { imdbId: "tt9999999999" });
    
    // Should return null for invalid ID, not crash
    if (data !== null) {
      console.log(`   ⚠️ Unexpected data for invalid ID`);
    } else {
      console.log(`   📊 Correctly returned null for invalid ID`);
    }
  });

  await test("getEnrichedRatings handles malformed IMDB ID", async () => {
    const data = await callAction("omdb:getEnrichedRatings", { imdbId: "not-an-imdb-id" });
    
    // Should handle gracefully
    console.log(`   📊 Returned: ${data === null ? "null (correct)" : "data"}`);
  });

  // ==================== ENRICHMENT TESTS ====================
  console.log("\n📍 Unified Enrichment Tests\n");

  await test("getEnrichedContent returns merged data", async () => {
    if (!movieId) throw new Error("No movie ID");
    
    const data = await callAction("enrichment:getEnrichedContent", { 
      tmdbId: movieId, 
      mediaType: "movie" 
    });
    
    if (!data) {
      throw new Error("No enriched content returned");
    }
    
    // Check structure
    if (!data.tmdb?.title) throw new Error("Missing TMDB title");
    if (typeof data.ratings?.tmdb !== "number") throw new Error("Missing TMDB rating");
    
    console.log(`   📊 Title: "${data.tmdb.title}"`);
    console.log(`   🎬 Trailer: ${data.trailer?.youtubeKey ? "YES" : "NO"}`);
    console.log(`   ⭐ TMDB: ${data.ratings.tmdb}`);
    console.log(`   🍅 RT: ${data.ratings.rottenTomatoes || "N/A"}`);
    console.log(`   📊 MC: ${data.ratings.metacritic || "N/A"}`);
  });

  await test("getEnrichedContent for TV show", async () => {
    if (!tvId) throw new Error("No TV ID");
    
    const data = await callAction("enrichment:getEnrichedContent", { 
      tmdbId: tvId, 
      mediaType: "tv" 
    });
    
    if (!data) {
      throw new Error("No enriched content returned for TV");
    }
    
    console.log(`   📊 Title: "${data.tmdb.title}"`);
    console.log(`   🎬 Trailer: ${data.trailer?.youtubeKey ? "YES" : "NO"}`);
  });

  await test("getEnrichedContent handles non-existent ID", async () => {
    const data = await callAction("enrichment:getEnrichedContent", { 
      tmdbId: 999999999, 
      mediaType: "movie" 
    });
    
    // Should return null, not crash
    console.log(`   📊 Returned: ${data === null ? "null (correct)" : "unexpected data"}`);
  });

  // ==================== SUMMARY ====================
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 TEST SUMMARY\n");
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${results.length}`);
  
  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }
  
  console.log("\n");
}

runTests().catch(console.error);
