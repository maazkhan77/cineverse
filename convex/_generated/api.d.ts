/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as cacheQueries from "../cacheQueries.js";
import type * as caching from "../caching.js";
import type * as enrichment from "../enrichment.js";
import type * as http from "../http.js";
import type * as lists from "../lists.js";
import type * as matchpoint from "../matchpoint.js";
import type * as omdb from "../omdb.js";
import type * as profiles from "../profiles.js";
import type * as ratings from "../ratings.js";
import type * as search from "../search.js";
import type * as searchQueries from "../searchQueries.js";
import type * as stats from "../stats.js";
import type * as tmdb from "../tmdb.js";
import type * as watchlist from "../watchlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  auth: typeof auth;
  cacheQueries: typeof cacheQueries;
  caching: typeof caching;
  enrichment: typeof enrichment;
  http: typeof http;
  lists: typeof lists;
  matchpoint: typeof matchpoint;
  omdb: typeof omdb;
  profiles: typeof profiles;
  ratings: typeof ratings;
  search: typeof search;
  searchQueries: typeof searchQueries;
  stats: typeof stats;
  tmdb: typeof tmdb;
  watchlist: typeof watchlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
