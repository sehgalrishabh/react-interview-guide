# ⚡ Performance

<div class="q-badges">
  <span class="badge badge-perf">⚡ Perf</span>
  <span class="badge badge-maang">MAANG</span>
  <span class="badge badge-witch">WITCH</span>
</div>

---

## React.memo, useMemo, useCallback — When They Actually Help

> **When do React.memo, useMemo, and useCallback actually help performance?**

<div class="q-badges">
  <span class="badge badge-perf">⚡ Perf</span>
  <span class="badge badge-witch">WITCH</span>
  <span class="badge badge-maang">MAANG</span>
</div>

They work as a **system** — each one alone is often useless:

```jsx
// The full pattern: React.memo + useCallback + useMemo together

// 1. Wrap expensive child with React.memo
const ProductList = React.memo(({ products, onSelect }) => {
  console.log("ProductList rendered"); // Should not log on parent re-renders
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id} onClick={() => onSelect(p.id)}>
          {p.name}
        </li>
      ))}
    </ul>
  );
});

function Shop() {
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState("all");

  // 2. useCallback — stable reference for the handler
  // Without this: new function reference every render → React.memo useless
  const handleSelect = useCallback((id) => {
    setCart((prev) => [...prev, id]);
  }, []); // No deps — setCart is stable

  // 3. useMemo — stable reference for the derived data
  // Without this: new array reference every render → React.memo useless
  const filteredProducts = useMemo(
    () => products.filter((p) => filter === "all" || p.category === filter),
    [filter], // Only recompute when filter changes
  );

  return (
    <>
      <CartCount count={cart.length} />{" "}
      {/* This can change without affecting ProductList */}
      <ProductList products={filteredProducts} onSelect={handleSelect} />
    </>
  );
}
```

**The mental model:**

```
React.memo(Child)        → "Don't re-render if props are same"
useCallback(fn, deps)    → "Keep same function reference across renders"
useMemo(() => val, deps) → "Keep same value reference across renders"

All three together = Child only re-renders when actual data changes
```

<div class="answer-why">

**✅ Why they must work together:** `React.memo` does a shallow prop comparison. If `onSelect` is a plain function (new reference every render) or `products` is a new array (new reference from `.filter()`), the shallow comparison fails — memo is bypassed. `useCallback` and `useMemo` provide the stable references that `React.memo` needs to work.

</div>

<div class="answer-whynot">

**❌ Why NOT apply these everywhere:** Every `useMemo`/`useCallback` call creates a closure, allocates memory, and runs a dependency comparison on every render. For components that render in under 1ms, this overhead can exceed the savings. The React team explicitly says: memoize when you have a measured problem, not preemptively. Use the React DevTools Profiler → Ranked chart to find actual bottlenecks.

</div>

---

## 🎯 TRICK: Does React.memo Prevent All Re-renders?

> **True or false: wrapping a component in React.memo means it never re-renders unnecessarily.**

<div class="q-badges">
  <span class="badge badge-trick">🎯 Trick</span>
  <span class="badge badge-perf">⚡ Perf</span>
  <span class="badge badge-maang">MAANG</span>
</div>

::: danger False — and this is a very common senior interview trap.
:::

`React.memo` only prevents re-renders caused by **parent renders with unchanged props**. It does NOT prevent re-renders from:

1. **Own state changes** (`useState`, `useReducer`)
2. **Context changes** the component subscribes to
3. **Custom hooks** with their own internal state

```jsx
const MemoizedDashboard = React.memo(({ title }) => {
  // Source 1: Own state — memo can't help here
  const [localCount, setLocalCount] = useState(0);

  // Source 2: Context — memo is bypassed entirely
  const { user } = useContext(AuthContext);

  // Source 3: Custom hook with state — memo is bypassed
  const { data } = useFetch("/api/dashboard");

  console.log("Rendered!"); // Still logs when any of above change
  return (
    <div>
      {title} - {user.name} - {localCount}
    </div>
  );
});

// Even with identical 'title' prop, this component re-renders when:
// - setLocalCount is called
// - AuthContext value changes
// - useFetch's internal state changes
```

```jsx
// Architecture fix: thin context-aware shell + deeply memoized inner
// Shell (re-renders on context change)
function DashboardShell() {
  const { user } = useContext(AuthContext); // Subscribes to context
  return (
    <DashboardInner
      userName={user.name} // Pass primitives, not objects
      userId={user.id} // Primitive = stable === comparison
    />
  );
}

// Inner (only re-renders when primitive props change)
const DashboardInner = React.memo(({ userName, userId }) => {
  // No context here — pure props
  return <div>{userName}</div>;
});
```

<div class="answer-why">

**✅ Why this architecture works:** Passing primitive values (string, number) instead of objects as props to `React.memo` children ensures the shallow comparison works correctly. `"Rishabh" === "Rishabh"` is `true`; `{name: "Rishabh"} === {name: "Rishabh"}` is `false` (different references).

</div>

<div class="answer-whynot">

**❌ Why NOT put context consumers inside deeply memoized trees:** Context propagation bypasses the entire `React.memo` system. If you subscribe to a frequently-changing context inside a memoized component, you've paid the cost of memoization for zero benefit. Architect context subscriptions at the "boundary" layer, pass primitives down.

</div>

---

## Code Splitting, Lazy Loading, and Suspense

> **Explain code splitting, React.lazy, and Suspense — full picture.**

<div class="q-badges">
  <span class="badge badge-perf">⚡ Perf</span>
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

**Code splitting** = bundle is divided into chunks loaded on demand instead of one giant JS file.

```jsx
// ❌ No code splitting — entire app in one bundle
import Dashboard from "./Dashboard"; // ~200KB
import Analytics from "./Analytics"; // ~150KB
import Settings from "./Settings"; // ~80KB
// User on /home pays download cost for Dashboard + Analytics + Settings upfront

// ✅ Route-level code splitting — highest ROI
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./Dashboard")); // Chunk loaded on demand
const Analytics = lazy(() => import("./Analytics"));
const Settings = lazy(() => import("./Settings"));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// ✅ Component-level splitting (heavy widgets)
const HeavyDataGrid = lazy(() => import("./HeavyDataGrid")); // Loads ag-grid only when needed
const VideoPlayer = lazy(() => import("./VideoPlayer")); // Loads video.js on demand

// ✅ Named exports with lazy (default export required)
// DataGrid.tsx — must re-export as default
const DataGrid = lazy(() =>
  import("./components/DataGrid").then((module) => ({
    default: module.DataGrid, // Named → default
  })),
);

// ✅ Preloading for anticipated navigation
const prefetchDashboard = () => import("./Dashboard"); // Call on hover/focus
<Link to="/dashboard" onMouseEnter={prefetchDashboard}>
  Dashboard
</Link>;
```

**In Next.js App Router:**

```jsx
// Each page.tsx is automatically a split point — no lazy() needed
// For component-level:
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Skip SSR for client-only components
});
```

<div class="answer-why">

**✅ Why route-level splitting is highest ROI:** A typical React SPA without splitting sends 500KB–1MB of JS on first load — most for routes the user never visits in this session. Route splitting means users pay download + parse cost only for pages they actually visit. JS parse time on mid-range Android is ~1 second per 100KB — route splitting can save 3–5 seconds of TTI.

</div>

<div class="answer-whynot">

**❌ Why NOT over-split into tiny chunks:** Each code split = a separate network request. HTTP/2 multiplexing helps, but 50 tiny chunks still has overhead vs 5 medium chunks. The ideal split granularity: chunks >30KB of JS that aren't needed on initial render. Also: always provide a skeleton `fallback` (not just a spinner) in Suspense to avoid layout shift (CLS impact).

</div>

---

## Virtualization and Large Lists

> **How do you handle rendering 10,000 items in React without killing performance?**

<div class="q-badges">
  <span class="badge badge-perf">⚡ Perf</span>
  <span class="badge badge-maang">MAANG</span>
</div>

Rendering 10,000 items = **10,000 DOM nodes** — React must reconcile all of them on every state change. The solution: **windowing / virtualization** — only render what's visible.

```jsx
import { FixedSizeList, VariableSizeList } from "react-window";
import { useVirtualizer } from "@tanstack/react-virtual"; // Modern alternative

// ✅ react-window — fixed height items (simplest)
function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={600} // Visible container height
      itemCount={items.length}
      itemSize={52} // Each row height
      width="100%"
      overscanCount={3} // Render 3 extra rows above/below for smooth scroll
    >
      {({ index, style }) => (
        // MUST pass style — it positions the item absolutely
        <div style={style} className="list-item">
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
  // DOM always has ~15 nodes regardless of items.length
}

// ✅ TanStack Virtual — dynamic heights (more powerful)
function DynamicList({ items }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated height
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ItemRow item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Complementary optimizations:**

```jsx
// Memoize each row to prevent re-render when scroll position changes
const ItemRow = React.memo(({ item }) => (
  <div className="row">
    {item.name} — {item.price}
  </div>
));

// Key stability — never use index as key for dynamic lists
// ❌ items.map((item, i) => <Row key={i} />)
// ✅ items.map(item => <Row key={item.id} />)
```

<div class="answer-why">

**✅ Why windowing is the single biggest list performance gain:** DOM node creation and layout calculation are expensive operations. 10,000 DOM nodes means 10,000 layout calculations on every scroll, resize, or state change. Virtualization keeps the DOM count constant (~15-20 nodes) regardless of data size — O(1) DOM complexity instead of O(n).

</div>

<div class="answer-whynot">

**❌ Why NOT virtualize everything:** Virtualization adds complexity — dynamic item heights require measurement APIs, scroll restoration needs manual handling, accessibility (screen readers, keyboard nav) needs extra work, and printing virtualized lists shows only visible rows. For lists under 100 items on desktop (or 50 on mobile), standard rendering with proper keys is perfectly fine.

</div>
