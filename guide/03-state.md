# 🗂️ State Management

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
  <span class="badge badge-witch">WITCH</span>
</div>

---

## Context API vs Redux vs Zustand vs Jotai

> **How do you choose between Context API, Redux, Zustand, and Jotai?**

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

|                     | Context API                    | Redux Toolkit          | Zustand                | Jotai / Recoil             |
| ------------------- | ------------------------------ | ---------------------- | ---------------------- | -------------------------- |
| **Bundle size**     | 0KB (built-in)                 | ~11KB                  | ~1KB                   | ~3KB                       |
| **Re-render model** | All consumers on change        | Selector-based         | Selector-based         | Atom-based                 |
| **DevTools**        | ❌                             | ✅ Excellent           | ✅ Basic               | ✅ Basic                   |
| **Async**           | Manual                         | RTK Query / Thunk      | Middleware / async fns | Async atoms                |
| **Best for**        | Low-freq updates (auth, theme) | Complex business logic | Most mid-large apps    | Fine-grained derived state |

```jsx
// Context API — simple, but all consumers re-render on any change
const ThemeContext = createContext();
// ✅ Good for: theme, locale, auth user (changes rarely)
// ❌ Bad for: frequently changing data (cart, filters, form state)

// Redux Toolkit — verbose but powerful
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    }, // Immer under the hood
  },
});
// ✅ Good for: complex flows, time-travel debugging, strict unidirectional

// Zustand — minimal, no Provider needed
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  // Async built-in
  fetchUser: async (id) => {
    const user = await api.getUser(id);
    set({ user });
  },
}));
// Selector — only re-renders when count changes
const count = useStore((state) => state.count);
// ✅ Good for: most apps in 2026, replaces Redux for 80% of use cases

// Jotai — atomic model
const countAtom = atom(0);
const doubleAtom = atom((get) => get(countAtom) * 2); // Derived atom

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const double = useAtomValue(doubleAtom);
  // Only re-renders when countAtom changes
}
// ✅ Good for: complex derived state, spreadsheet-like dependency graphs
```

<div class="answer-why">

**✅ Why Zustand wins for most 2026 apps:** No Provider boilerplate, selector-based subscriptions prevent unnecessary re-renders, works outside React (vanilla JS access to store), and the API is dead simple. RTK Query has reduced Redux's async advantage. Zustand gives 90% of Redux's power with 10% of the complexity.

</div>

<div class="answer-whynot">

**❌ Why NOT Redux for every app:** Redux made sense when React had no hooks and no alternatives. Today, RTK reduces boilerplate but you're still writing slices, reducers, selectors, and configuring middleware for things Zustand does in 5 lines. Reserve Redux for teams that genuinely need time-travel debugging, strict action logging, or have complex interdependent state machines.

</div>

::: tip Architect Signal — State Categorisation
Senior answer: categorise state FIRST before choosing a library.

- **Server state** (async, remote) → TanStack Query
- **URL state** (filters, pagination) → React Router / nuqs
- **UI state** (modal open, tab selected) → useState / Zustand
- **Form state** → react-hook-form
- **Global app state** (auth, cart) → Zustand / Redux

Choosing a library without categorising state first is a red flag.
:::

---

## 🎯 TRICK: Context API Performance Trap

> **Context API causes performance issues. When and exactly why?**

<div class="q-badges">
  <span class="badge badge-trick">🎯 Trick</span>
  <span class="badge badge-perf">⚡ Perf</span>
  <span class="badge badge-maang">MAANG</span>
</div>

::: danger Most Misunderstood React Topic
Developers use Context thinking it's an efficient state manager. It's not. It's a dependency injection mechanism with a specific re-render characteristic that will bite you at scale.
:::

**The problem:** Any time the context value reference changes, **ALL consumers re-render** — even if the specific part they use didn't change.

```jsx
// ❌ PROBLEM — single context with multiple concerns
function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [cart, setCart] = useState([]);

  // Every time user changes:
  // → new object reference { user, setUser, theme, setTheme, cart, setCart }
  // → ALL consumers re-render, including pure theme consumers
  return (
    <AppContext.Provider
      value={{ user, setUser, theme, setTheme, cart, setCart }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ThemeToggle only uses theme, but re-renders on EVERY user or cart change
function ThemeToggle() {
  const { theme, setTheme } = useContext(AppContext);
  console.log("ThemeToggle rendered"); // Logs on user login, cart update, etc.
  return (
    <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
      {theme}
    </button>
  );
}
```

```jsx
// ✅ FIX 1 — Split by domain (best approach)
<AuthContext.Provider value={{ user, setUser }}>
  <ThemeContext.Provider value={{ theme, setTheme }}>
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  </ThemeContext.Provider>
</AuthContext.Provider>;
// ThemeToggle now only re-renders when ThemeContext changes

// ✅ FIX 2 — Memoize context value (when you can't split)
function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("dark");

  const value = useMemo(
    () => ({ user, setUser, theme, setTheme }),
    [user, theme], // Only new reference when these change
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ✅ FIX 3 — Move to Zustand (eliminates Provider entirely)
const useAppStore = create((set) => ({
  user: null,
  theme: "dark",
  setTheme: (theme) => set({ theme }),
}));
// Each component selects only what it needs — zero unnecessary re-renders
```

<div class="answer-why">

**✅ Why this happens:** React compares context value with `Object.is` (reference equality). A new object literal `{}` is always a new reference, even if all properties are identical. Unlike Redux/Zustand which use selector functions to subscribe to slices, Context has no concept of "I only care about `theme`, not `user`."

</div>

<div class="answer-whynot">

**❌ Why NOT memoize every context value by default:** `useMemo` itself has overhead and can give a false sense of security. If `user` changes frequently (e.g., live user data), the memoization breaks every time. Domain-splitting is architecturally cleaner — it communicates intent and scales better as the codebase grows.

</div>

---

## TanStack Query and Server State

> **What is TanStack Query and how does it change the Redux model?**

<div class="q-badges">
  <span class="badge badge-core">Core</span>
  <span class="badge badge-new">2024+</span>
  <span class="badge badge-maang">MAANG</span>
</div>

**The fundamental insight:** State in a React app is of two types:

| Type             | Characteristics                                   | Tool                       |
| ---------------- | ------------------------------------------------- | -------------------------- |
| **Client state** | Synchronous, owned by your app, always up-to-date | useState / Zustand / Redux |
| **Server state** | Async, owned by server, can be stale, needs sync  | TanStack Query / SWR       |

Before TanStack Query, developers used Redux for server state — manually managing loading, error, success states with thunks. This was ~80% of Redux usage.

```jsx
// ❌ Before TanStack Query — Redux server state (50+ lines)
// actions.js
export const fetchUser = (id) => async (dispatch) => {
  dispatch({ type: "FETCH_USER_START" });
  try {
    const user = await api.getUser(id);
    dispatch({ type: "FETCH_USER_SUCCESS", payload: user });
  } catch (e) {
    dispatch({ type: "FETCH_USER_ERROR", payload: e.message });
  }
};
// reducer.js — handle 3 action types
// selectors.js — select loading, error, data
// component.js — useSelector, useDispatch, useEffect to trigger

// ✅ After TanStack Query — 5 lines
function UserProfile({ userId }) {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user", userId], // Cache key
    queryFn: () => api.getUser(userId),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3, // Auto-retry on failure
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} onRetry={refetch} />;
  return <div>{user.name}</div>;
}

// Mutations with optimistic updates
const mutation = useMutation({
  mutationFn: (newTodo) => api.createTodo(newTodo),
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    const previous = queryClient.getQueryData(["todos"]);
    queryClient.setQueryData(["todos"], (old) => [...old, newTodo]); // Optimistic
    return { previous }; // Rollback context
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(["todos"], context.previous); // Rollback
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
});
```

**What you get for free:**

- ✅ Automatic caching with configurable `staleTime`
- ✅ Background refetching when window regains focus
- ✅ Request deduplication (same query called twice → one network request)
- ✅ Pagination & infinite scroll hooks built in
- ✅ Optimistic updates with rollback
- ✅ DevTools for query inspection

<div class="answer-why">

**✅ Why TanStack Query wins for server state:** It models the actual lifecycle of async data — loading, success, error, stale, refetching. Redux models a state machine — great for client logic, wrong abstraction for data that lives on a server and can go stale. TanStack Query's cache is a client-side mirror of server data with sophisticated invalidation strategies.

</div>

<div class="answer-whynot">

**❌ Why TanStack Query doesn't replace Redux entirely:** Complex client-side business logic — multi-step checkout, undo/redo history, real-time collaborative state — still benefits from Redux's strict unidirectional flow and time-travel debugging. TanStack Query replaces Redux for data-fetching; it doesn't replace it for client state orchestration.

</div>
