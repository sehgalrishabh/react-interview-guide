# 🚀 React 18 / 19 & Server Components

<div class="q-badges">
  <span class="badge badge-new">React 19</span>
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

---

## React Server Components (RSC)

> **What are React Server Components and what problem do they solve?**

<div class="q-badges">
  <span class="badge badge-new">React 18+</span>
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

RSC solves the fundamental tension in React apps: **components need data → data fetching happens in the browser → waterfall requests → slow UX**. Previously the solution was SSR (server renders HTML, then hydrates), but the client still downloaded all component JavaScript.

**RSC runs components on the server.** Their output (a special RSC wire format, not HTML) streams to the client. Server components:

- Have **zero JS in the client bundle**
- Can **directly access databases, filesystems, secrets**
- Can be **async** — `await` fetch/db inline
- **Cannot** use `useState`, `useEffect`, event handlers, or browser APIs

```jsx
// app/products/[id]/page.tsx — Next.js App Router (Server Component by default)
async function ProductPage({ params }) {
  // Direct DB access — no API layer needed, no secret exposure
  const product = await db.products.findById(params.id);
  const reviews = await db.reviews.findByProduct(params.id);

  // This component ships ZERO JavaScript to the client
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <ReviewList reviews={reviews} />
      {/* Client component only where interactivity is needed */}
      <AddToCartButton productId={product.id} price={product.price} />
    </div>
  );
}

// 'use client' — opts into client rendering
("use client");
function AddToCartButton({ productId, price }) {
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await addToCart(productId);
          setAdded(true);
        })
      }
    >
      {added ? "✅ Added" : `Add to Cart — ₹${price}`}
    </button>
  );
}
```

**The rendering model:**

```
Traditional SPA:
Browser → Request page → Download ALL JS → Execute → Fetch data → Render
         [   blank screen   ][  parse/exec  ][  waterfall  ]

RSC / Next.js App Router:
Browser → Request page → Server runs components → Streams HTML + RSC payload
         [ instant content ] [ interactive parts hydrate progressively ]
```

**Composing server and client components:**

```jsx
// ✅ Server component wrapping client component — ALLOWED
// Server fetches data, passes serialisable props to client
async function CommentSection({ postId }) {
  const comments = await db.comments.findByPost(postId);
  return <CommentList initialComments={comments} postId={postId} />;
}

// ✅ Passing server component as children to client — ALLOWED
// The server component renders on server, client gets its output
<ClientLayout>
  <ServerSidebar /> {/* Renders on server, output passed as prop */}
</ClientLayout>;

// ❌ Importing server component inside client component — NOT ALLOWED
("use client");
import ServerComponent from "./ServerComponent"; // Build error!
// Client components can only receive server components as props/children
```

<div class="answer-why">

**✅ Why RSC is a paradigm shift:** RSC eliminates the client-server waterfall. In a traditional SPA: render → component mounts → `useEffect` fires → API call → re-render with data. With RSC: server fetches data colocated with the component, streams the result — no API call from client, no loading spinner, no layout shift. Bundle size drops dramatically because library code used only for data fetching never ships to the client.

</div>

<div class="answer-whynot">

**❌ Why RSC isn't a replacement for client components:** Anything interactive — forms, animations, drag-drop, real-time updates, browser API access — still needs `'use client'`. The mental model shift is: **default to server, opt into client only for interactivity**. Don't try to make everything a server component — useState and event handlers are fundamental to UX.

</div>

::: tip Architect Signal
Interviewers want to hear you talk about the **component boundary decision**: "I'd make everything a server component by default, push `'use client'` as far down the tree as possible — ideally to leaf components — to maximise what ships zero JS to the client."
:::

---

## React 19: Actions, useOptimistic, use()

> **What changed in React 19? Explain Actions, `useOptimistic`, and `use()`.**

<div class="q-badges">
  <span class="badge badge-new">React 19</span>
  <span class="badge badge-maang">MAANG</span>
</div>

React 19 takes ownership of the **async interaction lifecycle** — the pattern of manually tracking `isPending`, catching errors, and resetting forms is replaced by native primitives.

### Actions & useActionState

```jsx
// Before React 19 — manual async state management
function ProfileForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    try {
      await updateProfile(new FormData(e.target));
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPending(false);
    }
  };
  // ... 25+ lines of boilerplate
}

// ✅ React 19 — useActionState
import { useActionState } from "react";

async function updateProfileAction(prevState, formData) {
  try {
    await updateProfile(formData);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function ProfileForm() {
  const [state, action, isPending] = useActionState(updateProfileAction, {
    success: false,
    error: null,
  });

  return (
    <form action={action}>
      {" "}
      {/* Pass async function directly as action */}
      <input name="name" required />
      <input name="bio" />
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Profile"}
      </button>
      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">Profile updated!</p>}
    </form>
  );
}
```

### useOptimistic

```jsx
// Optimistic UI — show expected result immediately, rollback on error
"use client";
import { useOptimistic } from "react";

function LikeButton({ postId, initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,
    (currentLikes, amount) => currentLikes + amount, // Optimistic updater
  );

  const handleLike = async () => {
    addOptimisticLike(1); // Immediate UI update (+1)
    try {
      const newCount = await likePost(postId); // Server call
      setLikes(newCount); // Sync with actual server value
    } catch {
      // useOptimistic auto-rolls back to 'likes' on error
    }
  };

  return <button onClick={handleLike}>❤️ {optimisticLikes}</button>;
}
```

### use() — Read Promises and Context Anywhere

```jsx
import { use } from "react";

// use() can be called conditionally — unlike hooks
function UserGreeting({ userPromise }) {
  if (!userPromise) return <p>Guest</p>;

  const user = use(userPromise); // Suspends until promise resolves
  return <p>Welcome, {user.name}</p>;
}

// Pair with Suspense
<Suspense fallback={<Skeleton />}>
  <UserGreeting userPromise={fetchUser(id)} />
</Suspense>;

// use() for Context — can be called conditionally (unlike useContext)
function ThemeIcon({ showIcon }) {
  if (!showIcon) return null;
  const theme = use(ThemeContext); // ✅ Conditional context read — valid in React 19
  return <Icon color={theme.primary} />;
}
```

<div class="answer-why">

**✅ Why React 19 Actions matter:** The async form interaction pattern (pending → error → success → reset) is the most repeated pattern in every React app. React 19 makes it a first-class primitive. Combined with Server Actions in Next.js, `action={serverAction}` eliminates the API route entirely — the form submits directly to a server function.

</div>

<div class="answer-whynot">

**❌ Why NOT assume Actions replace all async patterns:** `useActionState` is optimised for form submissions. For arbitrary async operations (polling, WebSocket messages, chained API calls), `useState` + `useEffect` or TanStack Query are still appropriate. Also: `use()` with promises doesn't work outside Suspense — the component suspends until the promise resolves, so a Suspense boundary is always required.

</div>

---

## 🎯 TRICK: Hydration and Hydration Mismatches

> **What is hydration? What causes hydration mismatch errors and how do you fix them?**

<div class="q-badges">
  <span class="badge badge-trick">🎯 Trick</span>
  <span class="badge badge-new">SSR</span>
  <span class="badge badge-maang">MAANG</span>
</div>

::: danger Common in Next.js — Know This Cold
Every Next.js / SSR React developer hits this. Interviewers use it to test real-world experience.
:::

**Hydration** is the process of React attaching event listeners to server-rendered HTML, making it interactive. React walks the server HTML and the client component tree simultaneously — they must produce **identical output**.

**Hydration mismatch** = server rendered different HTML than the client would render → React throws `Error: Hydration failed` (development) or silently corrupts the DOM (production).

```jsx
// ❌ CAUSE 1: Date/time — different on server vs client
function Footer() {
  return <p>© {new Date().getFullYear()} Company</p>;
  // Server renders at 00:00:01 UTC
  // Client renders at 00:00:02 UTC → different string → MISMATCH
  // (Unlikely for year, but common for time/date displays)
}

// ❌ CAUSE 2: Math.random() or unique IDs
function Avatar() {
  return <div id={`avatar-${Math.random()}`}>...</div>;
  // Server: "avatar-0.123" | Client: "avatar-0.456" → MISMATCH
}

// ❌ CAUSE 3: typeof window / browser API checks
function Banner() {
  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return <div className={isDark ? "dark" : "light"}>...</div>;
  // Server: window undefined → isDark=false → className="light"
  // Client: window exists → isDark=true → className="dark" → MISMATCH
}

// ❌ CAUSE 4: User-agent dependent rendering
function PlatformBanner() {
  const isIOS = navigator.userAgent.includes("iPhone"); // navigator undefined on server!
}
```

```jsx
// ✅ FIX 1: suppressHydrationWarning — for intentional differences
<time suppressHydrationWarning>
  {new Date().toLocaleTimeString()} {/* OK to differ — clock updates anyway */}
</time>;

// ✅ FIX 2: useId() — stable IDs identical on server and client (React 18+)
function Avatar() {
  const id = useId(); // "r0:", "r1:", etc. — deterministic, same on server+client
  return <div id={id}>...</div>;
}

// ✅ FIX 3: ClientOnly wrapper — defer browser-dependent render
function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? children : fallback;
}

// Usage
<ClientOnly fallback={<div className="light">Loading...</div>}>
  <ThemeAwareBanner /> {/* Renders only after hydration */}
</ClientOnly>;

// ✅ FIX 4: Next.js dynamic() with ssr: false
import dynamic from "next/dynamic";
const ThemeAwareBanner = dynamic(() => import("./ThemeAwareBanner"), {
  ssr: false,
  loading: () => <div className="light">Loading...</div>,
});
```

<div class="answer-why">

**✅ Why hydration mismatches corrupt the app:** React's reconciler uses the server HTML as the "ground truth" DOM state during hydration. If client rendering disagrees, React has wrong assumptions about which DOM nodes correspond to which components — event handlers attach to wrong elements, state is associated with wrong nodes, and the UI becomes inconsistent or broken.

</div>

<div class="answer-whynot">

**❌ Why NOT use suppressHydrationWarning everywhere:** It suppresses the warning but doesn't fix the underlying inconsistency. The server and client still render different things — users on slow connections see the server version briefly, then a flash to the client version (layout shift). Only suppress when the difference is genuinely intentional and visually harmless (live clocks, random decorative elements).

</div>
