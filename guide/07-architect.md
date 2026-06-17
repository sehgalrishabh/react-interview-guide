# 🧠 Senior / Architect Questions

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

These questions are designed to reveal **system thinking, trade-off awareness, and architectural maturity**. At MAANG/Big4, the right answer isn't just technically correct — it frames the problem, explores alternatives, and articulates trade-offs.

---

## Design a Real-time Collaborative React App

> **Design a real-time collaborative editor like Notion or Figma. Walk through the architecture.**

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-new">2026</span>
  <span class="badge badge-maang">MAANG</span>
</div>

::: tip How to structure your answer
Layer it: (1) conflict resolution algorithm, (2) transport layer, (3) React state integration, (4) presence/awareness, (5) persistence.
:::

### Layer 1 — Conflict Resolution: OT vs CRDT

```
Operational Transformation (OT) — Google Docs approach
  ✅ Simpler to understand
  ✅ Smaller memory footprint
  ❌ Requires central server to mediate conflicts
  ❌ Single point of failure

CRDT (Conflict-free Replicated Data Types) — Figma/Linear approach
  ✅ Mathematically guaranteed to converge regardless of operation order
  ✅ Works peer-to-peer — no central arbitration needed
  ✅ Works offline — sync when reconnected
  ❌ Higher memory usage (stores tombstones for deleted items)
  ❌ More complex implementation
```

**Y.js** is the standard CRDT library in 2026. Used by TipTap, Quill, CodeMirror, Slate integrations.

### Layer 2 — Transport

```jsx
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

// Yjs document — the CRDT
const doc = new Y.Doc();

// Transport — WebSocket to sync with peers
const wsProvider = new WebsocketProvider(
  "wss://collab.yourapp.com",
  "document-room-abc123",
  doc,
);

// Offline persistence — survives page refresh
const indexeddbProvider = new IndexeddbPersistence("document-abc123", doc);

// Shared data types
const yText = doc.getText("content"); // Rich text
const yMap = doc.getMap("metadata"); // Key-value
const yArray = doc.getArray("comments"); // Ordered list
```

### Layer 3 — React Integration

```jsx
// useSyncExternalStore — the correct React 18 pattern for external stores
function useYText(yText) {
  return useSyncExternalStore(
    // Subscribe — called when yText changes (local or remote)
    (callback) => {
      yText.observe(callback);
      return () => yText.unobserve(callback);
    },
    // Get snapshot — current value
    () => yText.toString(),
  );
}

function CollaborativeEditor() {
  const content = useYText(yText);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    const currentValue = yText.toString();

    // Compute diff and apply as Yjs operations
    // In production: use a proper diff algorithm
    doc.transact(() => {
      yText.delete(0, currentValue.length);
      yText.insert(0, newValue);
    });
    // Yjs automatically syncs to all connected peers via WebSocket
  }, []);

  return (
    <textarea
      value={content}
      onChange={handleChange}
      placeholder="Start typing — changes sync to all collaborators"
    />
  );
}
```

### Layer 4 — Presence (Cursors, Avatars)

```jsx
import { Awareness } from "y-protocols/awareness";

const awareness = wsProvider.awareness;

// Broadcast your cursor position to all peers
function useCursorBroadcast(editorRef) {
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      awareness.setLocalStateField("cursor", {
        anchor: selection.anchorOffset,
        head: selection.focusOffset,
        color: "#6c63ff",
        name: currentUser.name,
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);
}

// Display all peers' cursors
function useCollaborators() {
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    const updateCollaborators = () => {
      const states = Array.from(awareness.getStates().entries())
        .filter(([clientId]) => clientId !== awareness.clientID)
        .map(([clientId, state]) => ({ clientId, ...state }));
      setCollaborators(states);
    };

    awareness.on("change", updateCollaborators);
    return () => awareness.off("change", updateCollaborators);
  }, []);

  return collaborators;
}
```

### Layer 5 — Persistence Strategy

```
Real-time sync:  Y.js WebSocket → all peers get updates instantly
Local cache:     IndexedDB (y-indexeddb) → survives refresh, works offline
Server storage:  WebSocket server saves Y.js binary updates to PostgreSQL/S3
                 On load: serve latest Y.js state → client applies on top
Snapshots:       Periodic server snapshots → point-in-time recovery
```

<div class="answer-why">

**✅ Why CRDTs over OT for new systems in 2026:** CRDTs are mathematically proven to converge without central coordination. Figma, Linear, and Liveblocks all use CRDT-based approaches. Y.js specifically has excellent performance characteristics (binary encoding, efficient diffs) and integrates with every major editor library. The peer-to-peer capability means offline editing works natively.

</div>

<div class="answer-whynot">

**❌ Why NOT build your own CRDT:** CRDT implementation is PhD-level complexity — subtle bugs cause data loss or infinite divergence. Y.js has years of battle-testing and handles edge cases (concurrent deletions, undo/redo across peers) that are non-obvious. Use the library; understand the algorithm conceptually.

</div>

---

## How Do You Handle React App Bundle Size at Scale?

> **A React app's bundle is 2MB. Walk me through your audit and optimisation process.**

<div class="q-badges">
  <span class="badge badge-perf">⚡ Perf</span>
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

::: tip Process matters more than tricks
Interviewers want to see a systematic approach, not a list of memorised optimisations.
:::

### Step 1 — Establish Baseline Metrics

```bash
# Core Web Vitals — what users actually experience
npx lighthouse https://yourapp.com --output=json

# Key metrics to track:
# LCP (Largest Contentful Paint) — loading → target < 2.5s
# INP (Interaction to Next Paint) — interactivity → target < 200ms
# CLS (Cumulative Layout Shift) — stability → target < 0.1
# Note: INP replaced FID in March 2024 — know this in interviews
```

### Step 2 — Bundle Analysis

```bash
# Webpack
npm run build -- --stats
npx webpack-bundle-analyzer stats.json

# Vite
# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [visualizer({ open: true, gzipSize: true })]

# What to look for:
# - Duplicate packages (lodash AND lodash-es in same bundle)
# - Heavy libraries (moment.js 230KB, full lodash 70KB)
# - Dev-only code in production build
# - Multiple React versions in monorepo (catastrophic)
```

### Step 3 — Common Fixes by Impact

```jsx
// HIGH IMPACT: Replace heavy date library
// ❌ moment.js — 230KB gzipped
import moment from "moment";
moment().format("DD MMM YYYY");

// ✅ date-fns — tree-shakeable, ~2KB per function
import { format } from "date-fns";
format(new Date(), "dd MMM yyyy");

// ✅ Temporal API (native, 2026 baseline in modern browsers)
new Temporal.PlainDate(2026, 1, 17).toLocaleString("en-IN");

// HIGH IMPACT: Tree-shakeable imports
// ❌ Ships entire lodash (70KB+)
import _ from "lodash";
const grouped = _.groupBy(items, "category");

// ✅ Native JS (0KB)
const grouped = Object.groupBy(items, (item) => item.category); // ES2024

// HIGH IMPACT: Dynamic imports for heavy features
// ❌ Ships PDF.js to every user even if they never export
import { exportToPDF } from "./pdf-export";

// ✅ Load only when user requests PDF
const handleExport = async () => {
  const { exportToPDF } = await import("./pdf-export");
  exportToPDF(data);
};

// MEDIUM IMPACT: Optimise icon libraries
// ❌ Ships all 1000+ icons
import { MdDashboard, MdSettings } from "react-icons/md";

// ✅ Direct path imports (tree-shaking doesn't always work for icon libs)
import MdDashboard from "react-icons/md/MdDashboard";

// MEDIUM IMPACT: Replace heavy charting lib with lighter alternative
// ❌ Chart.js (200KB) for simple bar charts
// ✅ recharts (treeshakeable) or uPlot (40KB) for performance-critical charts
// ✅ For simple charts: D3 + custom SVG (exactly what you need)
```

### Step 4 — Infrastructure Optimisations

```nginx
# Brotli compression (nginx) — 20-25% smaller than gzip
server {
  brotli on;
  brotli_comp_level 6;
  brotli_types text/plain text/css application/javascript application/json;

  # Aggressive caching for hashed assets
  location ~* \.[0-9a-f]{8}\.(js|css|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### Step 5 — React-specific Optimisations

```jsx
// Preload critical routes
<link rel="modulepreload" href="/assets/Dashboard.abc123.js" />

// Prefetch anticipated navigation (Next.js does this automatically)
<Link href="/dashboard" prefetch>Dashboard</Link>

// Use Suspense boundaries for progressive loading
<Suspense fallback={<HeaderSkeleton />}>
  <Header />
</Suspense>
<Suspense fallback={<ContentSkeleton />}>
  <MainContent />   {/* Streams in as it's ready */}
</Suspense>
```

<div class="answer-why">

**✅ Why measure first:** The most common mistake is optimising the wrong thing. In a 2MB bundle, the actual JS contributing to slow TTI might be a single heavy library that takes 10 minutes to replace. Guessing costs 2 weeks; measuring costs 10 minutes. Also: 2MB transferred ≠ 2MB parsed — gzip/brotli ratios vary wildly by content type.

</div>

<div class="answer-whynot">

**❌ Why NOT over-split chunks:** HTTP/2 multiplexes requests, but there's still overhead per chunk — TLS handshake amortisation, server push limits, browser's parallel request limit. Splitting every component into its own chunk (100+ chunks) can be slower than 5-10 well-sized chunks. The sweet spot: split by route + split components >30KB that aren't needed at initial load.

</div>

---

## 🎯 TRICK: "Make This React App Faster"

> **A senior engineer says your React app is slow. What do you do first?**

<div class="q-badges">
  <span class="badge badge-trick">🎯 Trick</span>
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-perf">⚡ Perf</span>
  <span class="badge badge-maang">MAANG</span>
</div>

::: danger The wrong answer costs you the offer.
"I'd add React.memo and useCallback everywhere" — this is the junior answer. It shows you've memorised tricks without understanding process.
:::

**The correct answer: MEASURE FIRST. Define "faster". Then diagnose.**

### Step 1 — Define the metric

```
"Faster" is ambiguous. Ask:
- Initial load slow? → LCP, TTI, bundle size
- Interactions janky? → INP (Interaction to Next Paint)
- Animations dropping frames? → FPS, Long Tasks
- Scrolling laggy? → Layout thrashing, paint cost
- API responses slow? → Network, server, N+1 queries
- On which device? Mobile mid-range (Moto G4 equiv.) or desktop?
- On which network? 3G, 4G, fibre?
```

### Step 2 — Diagnose with the right tool

```
Slow initial load:
  → Lighthouse audit (LCP, TTI, bundle size)
  → webpack-bundle-analyzer (what's in the bundle)
  → Network tab (waterfall — blocking resources)

Janky interactions (INP):
  → Chrome DevTools Performance tab → record interaction
  → Look for Long Tasks (>50ms blocks on main thread)
  → React DevTools Profiler → Ranked chart (slowest renders)

Scroll/animation jank:
  → Chrome DevTools → Performance → FPS meter
  → Look for layout thrashing (forced synchronous layouts)
  → Check for paint storms (too many CSS transitions)

Re-render issues:
  → React DevTools → Highlight updates → see what flashes
  → React Profiler → why-did-you-render library
```

### Step 3 — The actual hierarchy of optimisation impact

```
1. Network / Bundle (highest impact)
   - Reduce JS shipped (code splitting, tree shaking, lighter libs)
   - Enable Brotli compression
   - CDN for static assets
   - HTTP/2 push for critical resources

2. Server / Data fetching
   - Fix N+1 API calls (DataLoader pattern, GraphQL batching)
   - Add proper caching (TanStack Query staleTime, HTTP cache headers)
   - Use RSC to eliminate client-side waterfall

3. Rendering (medium impact)
   - Virtualise long lists (react-window / @tanstack/virtual)
   - Code split heavy components
   - Defer non-critical renders (useTransition, useDeferredValue)

4. Component memoisation (lowest impact, most over-used)
   - React.memo + useCallback for proven re-render bottlenecks
   - Only AFTER profiling confirms the component is the issue
```

<div class="answer-why">

**✅ Why this process-first answer wins:** It demonstrates engineering maturity. At MAANG, performance work is an engineering discipline — hypothesis → measure → fix → verify. Jumping to solutions without measurement is cargo-cult engineering. The interviewer is assessing if you'd make decisions with data or with instinct.

</div>

<div class="answer-whynot">

**❌ Why NOT start with React.memo/useCallback:** Real performance bottlenecks are almost always in category 1 or 2 (network/data), not category 4 (component memoisation). A component that renders in 2ms but is wrapped in unnecessary `useMemo` now renders in 1.5ms — saving 0.5ms while adding maintenance complexity. Meanwhile, the N+1 API call is making 50 network requests when 1 would do.

</div>

---

## Error Boundaries Full Usage and React 19

> **Explain error boundaries — usage, limitations, and what React 19 changes.**

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-new">React 19</span>
  <span class="badge badge-maang">MAANG</span>
</div>

Error boundaries catch JavaScript errors in the component tree, log them, and display a fallback UI instead of crashing the whole app.

```jsx
// Standard Error Boundary — class component (still required for getDerivedStateFromError)
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  // Called during render when error is thrown — return new state
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Called after render — side effects, logging
  componentDidCatch(error, info) {
    // info.componentStack — the component tree that errored
    errorReportingService.capture(error, {
      componentStack: info.componentStack,
      userId: this.props.userId,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        React.cloneElement(this.props.fallback, { onReset: this.handleReset })
      ) : (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

// react-error-boundary library — wraps class, adds hooks
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try Again</button>
    </div>
  );
}

// Granular boundaries — isolate blast radius
function App() {
  return (
    <ErrorBoundary FallbackComponent={AppCrashFallback}>
      <Header /> {/* Header crash = full fallback */}
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => queryClient.invalidateQueries(["user"])}
        resetKeys={[userId]} // Auto-reset when userId changes
      >
        <UserDashboard />{" "}
        {/* Dashboard crash = inline fallback, rest of app works */}
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={WidgetError}>
        <RecommendationsWidget /> {/* Widget crash = just widget fails */}
      </ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  );
}
```

**What error boundaries DO NOT catch:**

```jsx
// ❌ Event handlers — use try/catch manually
<button onClick={() => {
  try {
    riskyOperation();
  } catch (err) {
    setError(err.message); // Handle in state
  }
}}>

// ❌ Async errors — useEffect, setTimeout, Promises
useEffect(() => {
  fetchData()
    .then(setData)
    .catch(err => setError(err)); // Must catch manually
}, []);

// ❌ Server-side rendering errors
// ❌ Errors thrown in the error boundary itself
```

**React 19 — Error recovery on root:**

```jsx
// React 19 createRoot — new error hooks
const root = createRoot(container, {
  onCaughtError(error, errorInfo) {
    // Called when error boundary catches an error
    console.error("Caught by boundary:", error, errorInfo.componentStack);
  },
  onUncaughtError(error, errorInfo) {
    // Called when no boundary catches it — app will crash
    errorReporter.fatal(error);
  },
  onRecoverableError(error, errorInfo) {
    // Called for errors React recovers from automatically (hydration mismatches)
    console.warn("Recoverable error:", error);
  },
});
```

<div class="answer-why">

**✅ Why granular error boundaries matter:** The principle is **blast radius isolation**. A crash in a recommendations widget shouldn't take down checkout. The pattern: wrap each major feature section with its own boundary with a meaningful fallback. Users can still complete their primary task even if a secondary widget fails. This is what separates production-grade apps from hobby projects.

</div>

<div class="answer-whynot">

**❌ Why NOT one global error boundary at the root:** That's equivalent to a `try/catch` around your entire `main()` — it catches everything but gives you no information about where the error originated and shows one generic fallback for all failure modes. Granular boundaries let you: (1) show context-specific fallbacks, (2) retry only the failed section, (3) log with the right context, (4) keep the rest of the app functional.

</div>
