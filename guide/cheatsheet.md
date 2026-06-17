# ⚡ Interview Cheatsheet

Quick-fire revision. Know these cold before walking into any React interview.

---

## Hook Decision Tree

```
Need to store data that changes UI?
  → useState / useReducer

Need to run a side effect (fetch, subscription, DOM)?
  → useEffect (async) | useLayoutEffect (DOM measurement, pre-paint)

Need a stable value across renders WITHOUT triggering re-render?
  → useRef

Need to share state across components?
  → Context (low-freq) | Zustand (high-freq) | TanStack Query (server state)

Need to optimise expensive computation?
  → useMemo (memoize value) | useCallback (memoize function)

Need to defer non-urgent UI update?
  → useTransition (own the setter) | useDeferredValue (own the value)

Need stable IDs for SSR?
  → useId

Need to sync with external store?
  → useSyncExternalStore
```

---

## Re-render Cheat Sheet

| Trigger                        | Causes Re-render?        | Fix                             |
| ------------------------------ | ------------------------ | ------------------------------- |
| Parent re-renders              | ✅ Yes (if props change) | `React.memo`                    |
| Own `useState` / `useReducer`  | ✅ Always                | Structure state properly        |
| Context value changes          | ✅ All consumers         | Split contexts / Zustand        |
| `useRef` mutation              | ❌ Never                 | N/A — by design                 |
| Same state value set           | ❌ No (bailed out)       | React compares with `Object.is` |
| `React.memo` + unchanged props | ❌ No                    | This is the goal                |
| `React.memo` + context change  | ✅ Yes                   | Move context up / Zustand       |

---

## When to Use What — State

| State Type                              | Tool                         |
| --------------------------------------- | ---------------------------- |
| Server / async data                     | TanStack Query               |
| URL / filter state                      | React Router params / `nuqs` |
| Form state                              | `react-hook-form`            |
| Simple local UI state                   | `useState`                   |
| Complex local UI state                  | `useReducer`                 |
| Shared low-freq global (theme, auth)    | Context API                  |
| Shared high-freq global (cart, filters) | Zustand                      |
| Complex client business logic           | Redux Toolkit                |

---

## Performance Checklist

- [ ] Long lists (>100 items) → `react-window` or `@tanstack/virtual`
- [ ] Heavy routes → `React.lazy` + `Suspense`
- [ ] Bundle analysed → `webpack-bundle-analyzer` / `rollup-visualizer`
- [ ] No `moment.js` → use `date-fns` or native `Temporal`
- [ ] No full lodash import → named imports or native JS
- [ ] Brotli compression enabled on server
- [ ] Images → `next/image` or lazy loading + `srcset`
- [ ] Core Web Vitals measured → Lighthouse CI in pipeline
- [ ] INP < 200ms, LCP < 2.5s, CLS < 0.1

---

## Trick Question Quick Answers

| Question                               | Trap              | Correct Answer                         |
| -------------------------------------- | ----------------- | -------------------------------------- |
| What does stale closure log?           | "Current count"   | Always logs initial value (0)          |
| Does React.memo stop all re-renders?   | "Yes"             | No — own state + context still trigger |
| Is VDOM always faster than direct DOM? | "Yes"             | No — VDOM is for ergonomics + scale    |
| Does Redux replace TanStack Query?     | "Yes"             | No — different state types             |
| Batching in setTimeout?                | "No batching"     | React 18 auto-batches everywhere       |
| useCallback vs useMemo difference?     | "Different hooks" | useCallback = useMemo returning fn     |
| Can you call hooks conditionally?      | "Yes"             | Never — breaks linked list order       |

---

## React 19 New APIs

| API              | What it does                     | Replaces                              |
| ---------------- | -------------------------------- | ------------------------------------- |
| `useActionState` | Manages async form action state  | Manual isPending/error state          |
| `useOptimistic`  | Optimistic UI with auto-rollback | Custom optimistic state logic         |
| `use(promise)`   | Read promise in render           | useEffect data fetching in some cases |
| `use(Context)`   | Conditional context read         | `useContext` (can't be conditional)   |
| `onCaughtError`  | Root-level error hook            | Custom error tracking setup           |

---

## RSC Mental Model

```
Default (Server Component):
  ✅ async/await directly
  ✅ Direct DB / filesystem access
  ✅ Zero JS in client bundle
  ❌ No useState, useEffect
  ❌ No event handlers
  ❌ No browser APIs

'use client' (Client Component):
  ✅ useState, useEffect, all hooks
  ✅ Event handlers, onClick etc.
  ✅ Browser APIs (window, localStorage)
  ❌ Cannot be async component
  ❌ Adds JS to bundle

Rule: Push 'use client' as far DOWN the tree as possible.
Ideal: Leaf interactive components are client, everything else is server.
```

---

## Testing Quick Rules

```
Query priority:      getByRole > getByLabelText > getByText > getByTestId
Async elements:      findBy* (not getBy*) — auto-waits + act()
API mocking:         MSW (Mock Service Worker) — works in browser + Node
Avoid:               shallow rendering, implementation details, testing state directly
Coverage target:     Focus on critical paths, not % number
E2E tool 2026:       Playwright (replaced Cypress as industry standard)
```

---

## Architecture Signals (Senior Keywords)

Use these phrases to signal seniority:

- **"I'd profile first with React DevTools Profiler before optimising"**
- **"The trade-off here is..."**
- **"This depends on the update frequency — for low-freq, Context; for high-freq, Zustand"**
- **"I'd push 'use client' as far down the tree as possible"**
- **"At scale, I'd split this into separate contexts to avoid unnecessary consumer re-renders"**
- **"Error boundaries should be granular — isolate blast radius per feature section"**
- **"I'd categorise state first: server state vs client state vs URL state"**
- **"Feature flags decouple deploy from release — critical for trunk-based development"**
