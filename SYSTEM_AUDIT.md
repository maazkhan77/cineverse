# System Audit Report
**Date:** 2026-02-06
**Scope:** Client-side Architecture, UI Components, Performance

## 1. Critical Issues & Race Conditions

### Race Condition in Search/Filtering
**Component:** `MoviesContent.tsx`, `SeriesContent.tsx`, `MoviesPage.tsx`
**Severity:** 🔴 High
**Description:**
The data fetching logic uses `useEffect` to trigger independent `fetch` requests when filters change. There is no cancellation mechanism (`AbortController`) for stale requests.
**Scenario:**
1. User clicks "Filter A" (Request 1 starts - Slow Network).
2. User quickly clicks "Filter B" (Request 2 starts - Fast Network).
3. Request 2 resolves, UI updates to "Filter B" results.
4. Request 1 resolves, UI overwrites "Filter B" results with "Filter A" results.
**Result:**
The UI displays data that mismatches the active filter state.

### Missing Focus Management
**Component:** `ContentModal.tsx`, `FilterDrawer.tsx`
**Severity:** 🟠 Medium
**Description:**
Custom modal implementations lack focus trapping. Users navigating via keyboard (Tab) can modify the background page context while the modal is open.
**Accessiblity Violation:** WCAG 2.1 Focus Order.

### Scroll Locking
**Component:** `ContentModal.tsx`
**Severity:** 🟡 Low
**Description:**
The background page remains scrollable when the modal is open, which can lead to disjointed UX on mobile devices.

## 2. "Bandage" Solutions & Custom Implementations

### Custom Carousel (`ContentRow`)
**Current Implementation:**
- Uses button-triggered `scrollBy` logic.
- Uses `useRef` and manual math for scroll distance.
**Issues:**
- **No Touch Support:** Swipe gestures on mobile do not work.
- **Scroll Snap:** Native scroll snapping is missing or inconsistent.
- **Maintainability:** Custom logic for visibility calculation of arrows is brittle.
**Recommendation:**
Replace with `embla-carousel-react`. It provides native touch support, physics-based scrolling, and robust React hooks.

### Custom Toast System (`ToastProvider`)
**Current Implementation:**
- `useState` array with `setTimeout` for dismissal.
**Issues:**
- **Animation Stacking:** Basic implementation lacks layout smoothing when removing items from the middle of the stack.
- **Promise Handling:** No native support for promise-based toasts (Loading -> Success/Error).
**Recommendation:**
Replace with `sonner`. It is 1kb, supports stacking cards, promises, and is production-ready.

### Manual Infinite Scroll
**Current Implementation:**
- `IntersectionObserver` inside `useEffect` in `MoviesContent.tsx`.
**Issues:**
- Code duplication across pages.
- Complex state management for `isLoading`, `hasMore`, `page`.
**Recommendation:**
Extract to a generic `useInfiniteScroll` hook or use `@tanstack/react-query`'s `useInfiniteQuery`.

## 3. Recommended Production Stack

To move from "bandage works" to a production-grade system, we recommend implementing the following ecosystem:

| Feature | Current "Bandage" | Recommended Library | Why? |
| :--- | :--- | :--- | :--- |
| **Carousel** | Custom `scrollBy` | **Embla Carousel** | Touch support, inertia, rich API. |
| **Toasts** | Custom Context | **Sonner** | Accessible, stackable, promise support. |
| **Modals** | Custom `div` | **Radix UI Dialog** | Fully accessible (Focus trap, Screen reader support). |
| **Data Fetching** | `useEffect` + `fetch` | **TanStack Query** | Caching, Deduping, Race Condition handling. |
| **Forms** | Controlled Inputs | **React Hook Form + Zod** | Validation, Performance (uncontrolled inputs). |
| **Icons** | SVG Strings | **Lucide React** | Consistent, tree-shakeable icons. |

## 4. Performance & Edge Cases

### Edge Cases
- **Empty Search Results:** Handled in most views.
- **API Failures:** Basic `console.error` logging. UI mostly stays in loading state or shows empty. Needs explicit Error Boundaries or Error UI components.
- **Image Fallbacks:** `MovieCard` handles null poster paths, but `ContentModal` might render broken visuals if specific metadata is missing.

### Performance
- **Image Optimization:** Good use of `next/image`.
- **Bundle Splitting:** Server Components refactor (recently done) largely solves initial bundle size issues.
- **Re-renders:** `ContentRow` scroll listeners run frequently. Should be throttled or removed in favor of `IntersectionObserver` or CSS-only scroll detection where possible.

## 5. Immediate Action Plan
1. Fix Race Conditions in `MoviesContent` using `AbortController`.
2. Replace `ContentRow` with `embla-carousel`.
3. standardize Data Fetching patterns.
