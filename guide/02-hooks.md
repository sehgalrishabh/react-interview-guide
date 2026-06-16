# 🪝 Hooks Deep Dive

<div class="q-badges">
  <span class="badge badge-core">Core</span>
  <span class="badge badge-witch">WITCH</span>
  <span class="badge badge-maang">MAANG</span>
</div>

---

## Rules of Hooks and Why They Exist

> **What are the rules of hooks and WHY do they exist?**

<div class="q-badges">
  <span class="badge badge-core">Core</span>
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-witch">WITCH</span>
</div>

**Rule 1:** Only call hooks at the **top level** — never inside loops, conditions, or nested functions.
**Rule 2:** Only call hooks from **React function components** or **custom hooks**.

```jsx
// ❌ WRONG — conditional hook breaks call order
function Profile({ isLoggedIn }) {
  if (isLoggedIn) {
    const [name, setName] = useState(''); // Conditional!
  }
  // If isLoggedIn flips false → hook order changes → React reads wrong state
}

// ✅ CORRECT — always called, condition goes inside
function Profile({ isLoggedIn }) {
  const [name, setName] = useState('');
  if (!isLoggedIn) return null; // Condition AFTER hooks
}
```

<div class="answer-why">

**✅ Why this exists:** React tracks hook state by **call order**, not by name. Internally, each component's hook state is stored as a **linked list on the fiber node**. Hook #1 → Hook #2 → Hook #3. If a conditional skips Hook #1 on re-render, React reads Hook #2's state for Hook #1 — complete corruption. The order must be identical every render.

</div>

<div class="answer-whynot">

**❌ Why NOT name-based hook tracking:** Naming hooks would require a runtime registry lookup on every call — O(n) overhead per hook per render. Call-order tracking is O(1) — just increment a cursor. This is a deliberate performance tradeoff. The `eslint-plugin-react-hooks` enforces the rules statically so you never hit the runtime corruption.

</div>

::: tip Architect Signal
If asked "could React have been designed differently?", say: Yes — Svelte and Vue 3 Composition API use a different model. But React's linked-list approach is why hooks are extremely fast. The constraint (rules) is the price of the performance.
:::

---

## useEffect vs useLayoutEffect

> **What is the difference between `useEffect` and `useLayoutEffect`? When do you use each?**

<div class="q-badges">
  <span class="badge badge-core">Core</span>
  <span class="badge badge-perf">⚡ Perf</span>
  <span class="badge badge-maang">MAANG</span>
</div>

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| **Timing** | After browser paint | After DOM mutation, before paint |
| **Blocking** | Non-blocking (async) | Blocking (sync) |
| **SSR safe** | ✅ Yes | ⚠️ Warns on server |
| **Use for** | API calls, subscriptions, logging | DOM measurements, preventing flicker |

```jsx
// useLayoutEffect — DOM measurement BEFORE paint
function Tooltip({ target }) {
  const tooltipRef = useRef();
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    // Reading getBoundingClientRect here is safe — no flicker
    // because this runs BEFORE the browser paints the tooltip
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setPos({
      top: rect.top - tooltipRect.height - 8,
      left: rect.left + rect.width / 2 - tooltipRect.width / 2
    });
  }, [target]);

  return (
    <div ref={tooltipRef} style={{ position: 'fixed', ...pos }}>
      Tooltip content
    </div>
  );
}

// useEffect — data fetching, subscriptions (non-blocking)
useEffect(() => {
  const subscription = store.subscribe(setState);
  return () => subscription.unsubscribe();
}, []);
```

<div class="answer-why">

**✅ Why useLayoutEffect for DOM reads:** If you read layout (dimensions, scroll position) in `useEffect`, the sequence is: DOM mutated → browser paints → your effect reads layout → state update → second paint. The user sees a flicker between the two paints. `useLayoutEffect` fires before the first paint — one paint, no flicker.

</div>

<div class="answer-whynot">

**❌ Why NOT useLayoutEffect by default:** It's synchronous — it blocks the browser from painting until it completes. Heavy work in `useLayoutEffect` causes visible jank. Also, in Next.js / SSR environments, `useLayoutEffect` doesn't run on the server and emits a warning. For SSR-safe isomorphic code, use `useEffect` or the `useIsomorphicLayoutEffect` pattern (which is `useLayoutEffect` on client, `useEffect` on server).

</div>

---

## 🎯 TRICK: Infinite Loop in Custom Hook

> **What's wrong with this custom hook?**

<div class="q-badges">
  <span class="badge badge-trick">🎯 Trick</span>
  <span class="badge badge-maang">MAANG</span>
  <span class="badge badge-witch">WITCH</span>
</div>

::: danger Classic Trap
This question separates developers who understand closures + React's rendering model from those who just use hooks.
:::

```jsx
// ❌ BROKEN — causes infinite loop
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {       // New reference on EVERY render
    setLoading(true);
    const res = await fetch(url);
    setData(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData is new every render → effect re-runs → setState → re-render → new fetchData → ∞

  return { data, loading };
}
```

**What happens:**
1. Render → new `fetchData` reference created
2. Effect sees new `fetchData` → runs → `setData` → re-render
3. Re-render → new `fetchData` → effect runs again → ∞

```jsx
// ✅ FIX 1 (Recommended) — define inside effect
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false; // Cleanup for race conditions

    const fetchData = async () => {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();
      if (!cancelled) { // Don't setState if unmounted
        setData(json);
        setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [url]); // Only re-fetch when url changes

  return { data, loading };
}

// ✅ FIX 2 — useCallback to stabilize reference
const fetchData = useCallback(async () => {
  const res = await fetch(url);
  setData(await res.json());
}, [url]); // Only new reference when url changes
```

<div class="answer-why">

**✅ Why Fix 1 is preferred:** Defining the async function inside the effect collocates the logic with its scope, avoids the hook dependency chain entirely, and is the pattern recommended by the React docs. It also naturally enables the `cancelled` cleanup flag to handle race conditions (fast-typing search, tab switching).

</div>

<div class="answer-whynot">

**❌ Why NOT ignore the eslint warning:** The `react-hooks/exhaustive-deps` rule exists precisely to catch this. Ignoring it with `// eslint-disable` hides real bugs. The loop only manifests in certain conditions — you might miss it in development and ship it to production.

</div>

---

## useRef Beyond DOM Refs

> **What are the use cases of `useRef` beyond storing DOM references?**

<div class="q-badges">
  <span class="badge badge-core">Core</span>
  <span class="badge badge-maang">MAANG</span>
</div>

`useRef` returns a mutable object `{ current: value }` that **persists across renders without causing re-renders** when mutated. This single property makes it useful for far more than DOM access.

```jsx
// 1. usePrevious — store last render's value
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value; // Updates AFTER render
  });
  return ref.current; // Returns PREVIOUS render's value
}

const prevCount = usePrevious(count);
// count=3, prevCount=2

// 2. Stable interval/timeout IDs
useEffect(() => {
  const id = setInterval(tick, 1000);
  intervalRef.current = id; // Store without re-render
  return () => clearInterval(intervalRef.current);
}, []);

// 3. isMounted pattern — prevent setState on unmounted component
useEffect(() => {
  const isMounted = { current: true };
  fetchData().then(data => {
    if (isMounted.current) setState(data);
  });
  return () => { isMounted.current = false; };
}, []);

// 4. Latest callback ref pattern — stable event handler with fresh closure
function useEvent(handler) {
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler; // Always latest
  });
  return useCallback((...args) => {
    return handlerRef.current(...args);
  }, []); // Stable reference, never stale
}

// 5. Counting renders (debugging)
const renderCount = useRef(0);
renderCount.current += 1;
console.log('Render #', renderCount.current); // Doesn't cause re-render
```

<div class="answer-why">

**✅ Why useRef for these cases:** Unlike `useState`, mutating `ref.current` does **not** schedule a re-render. This makes it perfect for values that need to persist across renders purely for bookkeeping — timers, flags, previous values — values that drive **logic** not **UI**.

</div>

<div class="answer-whynot">

**❌ Why NOT use refs as state escape hatches:** If a value should update the UI when it changes, it must be state — not a ref. Mutating a ref doesn't trigger re-render, so your UI goes stale. The rule: **ref = invisible to render output, state = drives render output.**

</div>

---

## useTransition vs useDeferredValue — React 18

> **How do `useTransition` and `useDeferredValue` differ? When do you use which?**

<div class="q-badges">
  <span class="badge badge-core">Core</span>
  <span class="badge badge-new">React 18</span>
  <span class="badge badge-perf">⚡ Perf</span>
  <span class="badge badge-maang">MAANG</span>
</div>

Both hooks defer non-urgent work so the UI stays responsive. The distinction is **who owns the state**:

| | `useTransition` | `useDeferredValue` |
|---|---|---|
| **You own** | The state setter | Just the value (from props/context) |
| **Wrap** | The `setState` call | The value itself |
| **isPending** | ✅ Yes — built in | ❌ No — must derive manually |
| **Use when** | You control the update | Value comes from outside |

```jsx
// useTransition — YOU control the state setter
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setQuery(e.target.value); // Urgent — update input immediately

    startTransition(() => {
      // Non-urgent — React can interrupt and restart this
      setResults(heavyFilter(allData, e.target.value));
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </>
  );
}

// useDeferredValue — value comes from outside (props/context)
function ResultsList({ query }) {
  // You can't wrap the setter — query comes from parent
  const deferredQuery = useDeferredValue(query);

  // Memoize with deferred value — only re-computes when deferredQuery settles
  const results = useMemo(
    () => heavyFilter(allData, deferredQuery),
    [deferredQuery]
  );

  const isStale = query !== deferredQuery; // Derive pending state

  return (
    <div style={{ opacity: isStale ? 0.5 : 1 }}>
      {results.map(r => <Result key={r.id} {...r} />)}
    </div>
  );
}
```

<div class="answer-why">

**✅ Why both exist:** React 18's Concurrent Mode can **interrupt, pause, and restart renders**. These hooks mark work as "low priority" — React yields to urgent work (keystrokes, clicks) first. The result: no jank while heavy filtering/rendering happens in the background. `useTransition` is for when you control the update; `useDeferredValue` is the consumer-side equivalent.

</div>

<div class="answer-whynot">

**❌ Why these are NOT magic performance fixes:** They **delay** work — they don't eliminate it. If your filter function blocks the main thread for 500ms, it still blocks — just after the keystroke is committed. Combine with `useMemo` to avoid recomputation, or move heavy work to a Web Worker for true off-thread execution. Also: don't use these prematurely — profile with React DevTools Profiler first.

</div>