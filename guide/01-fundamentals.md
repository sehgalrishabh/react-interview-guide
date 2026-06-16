# ⚛️ Core Fundamentals

<div class="q-badges">
  <span class="badge badge-core">Core</span>
  <span class="badge badge-witch">WITCH</span>
  <span class="badge badge-maang">MAANG</span>
</div>

---

## Virtual DOM & Reconciliation

> **What is the Virtual DOM and how does React's reconciliation work?**

React maintains a lightweight **in-memory representation** of the real DOM called the Virtual DOM (VDOM). When state or props change, React:

1. Creates a **new VDOM tree**
2. **Diffs** it against the previous VDOM using a heuristic O(n) algorithm (reconciliation)
3. Computes the **minimal set of DOM mutations**
4. Applies them in a **single batch** (commit phase)

```jsx
// React renders this → creates VDOM → diffs → patches real DOM
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
  // On click: new VDOM { button: "1" } vs old { button: "0" }
  // Only textContent of button is patched — nothing else touches DOM
}
```

<div class="answer-why">

**✅ Why this is correct:** React's diffing uses two key heuristics: (1) Elements of different types produce different trees — React destroys old and creates new. (2) `key` props help identify which list items changed. Without this, full DOM re-mutation on every render would be catastrophically slow.

</div>

<div class="answer-whynot">

**❌ Why NOT "VDOM is always faster than direct DOM":** VDOM is NOT always faster than direct DOM manipulation. For small, targeted DOM updates (like a vanilla counter), direct DOM is faster. VDOM's value is **developer ergonomics + acceptable performance at scale**, not raw speed. Svelte compiles away the VDOM entirely and is often faster.

</div>

::: warning Reconciliation Keys — Classic Trick
Without `key` props on list items, React uses index as key. When you insert at the beginning of a list, every item appears "changed" — O(n) DOM mutations instead of O(1). Always use stable, unique IDs as keys — never array index for dynamic lists.
:::

---

## Controlled vs Uncontrolled Components

> **Explain the difference between controlled and uncontrolled components.**

<div class="q-badges">
  <span class="badge badge-core">Core</span>
  <span class="badge badge-witch">WITCH</span>
</div>

**Controlled:** Form data is managed by React state. Every input change triggers `setState`. React is the "single source of truth."

**Uncontrolled:** Form data is managed by the DOM itself. You access values via `ref` (`useRef`).

```jsx
// ✅ Controlled — React owns the value
function ControlledInput() {
  const [val, setVal] = useState('');
  return (
    <input
      value={val}
      onChange={e => setVal(e.target.value)}
    />
  );
}

// ✅ Uncontrolled — DOM owns the value
function UncontrolledInput() {
  const ref = useRef();
  const handleSubmit = () => console.log(ref.current.value);
  return <input ref={ref} defaultValue="initial" />;
}

// ⚠️ File input CANNOT be controlled — always use ref
<input type="file" ref={fileRef} />
```

<div class="answer-why">

**✅ Why use controlled:** Full React control — easy validation, instant field feedback, programmatic disabling of submit button based on form state. The form's values live in React state, making them easy to read, transform, and submit.

</div>

<div class="answer-whynot">

**❌ Why NOT controlled everywhere:** Controlled inputs re-render on every keystroke. For a form with 20 fields, that's 20 state values × n keystrokes = many re-renders. Libraries like `react-hook-form` use **uncontrolled** approach with refs internally and only re-render on submit/validation — significantly faster for large forms.

</div>

---

## useMemo vs useCallback

> **What is the difference between `useMemo` and `useCallback`?**

<div class="q-badges">
  <span class="badge badge-core">Core</span>
  <span class="badge badge-witch">WITCH</span>
  <span class="badge badge-maang">MAANG</span>
</div>

| Hook | Returns | Memoizes |
|------|---------|----------|
| `useMemo` | The **value** | Result of a computation |
| `useCallback` | The **function** | A function reference |

```jsx
// useMemo — memoizes the RESULT
const expensiveValue = useMemo(
  () => computeExpensiveValue(a, b),
  [a, b]
);

// useCallback — memoizes the FUNCTION
const stableHandler = useCallback(
  () => doSomething(id),
  [id]
);

// useCallback is literally syntactic sugar for:
const stableHandler = useMemo(() => () => doSomething(id), [id]);
// Same thing — useMemo returning a function
```

<div class="answer-why">

**✅ Why they exist:** Both prevent unnecessary reference changes. In React, every render creates new object/function references. If you pass a new function reference to a `React.memo` child, it re-renders even if the behavior is identical. `useCallback` stabilizes the reference.

</div>

<div class="answer-whynot">

**❌ Why NOT wrap everything in useMemo/useCallback:** The memoization itself has overhead — closure creation, dependency comparison on every render. If a component renders in 0.05ms and memoization costs 0.03ms, you've saved very little. **Profile first.** Only apply when: (1) passing to `React.memo` children, (2) used as `useEffect` dependency, (3) you've measured an actual perf issue.

</div>

---

## 🎯 TRICK: Stale Closure in useEffect

> **What does this code log and why?**

<div class="q-badges">
  <span class="badge badge-trick">🎯 Trick</span>
  <span class="badge badge-witch">WITCH</span>
  <span class="badge badge-maang">MAANG</span>
</div>

::: danger Classic Interview Trap
This is one of the most common React interview trick questions. Junior devs say "it logs the current count." Senior devs explain exactly why it doesn't.
:::

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count); // ❓ What does this log?
    }, 1000);
    return () => clearInterval(id);
  }, []); // Empty deps — runs once on mount

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**Answer: It always logs `0` — even after clicking the button many times.**

This is the **stale closure problem**. The closure captures `count = 0` at mount time. Clicking the button updates React state for new renders, but the closure inside `setInterval` is frozen to the render it was created in.

```jsx
// FIX 1: Add count to deps (restarts interval on every change)
useEffect(() => {
  const id = setInterval(() => {
    console.log(count); // ✅ Always current
  }, 1000);
  return () => clearInterval(id);
}, [count]); // New interval on each count change

// FIX 2: useRef to always access latest value without restarting
const countRef = useRef(count);
useEffect(() => {
  countRef.current = count;
}, [count]);

useEffect(() => {
  const id = setInterval(() => {
    console.log(countRef.current); // ✅ Always latest, interval stable
  }, 1000);
  return () => clearInterval(id);
}, []); // No restart needed
```

<div class="answer-why">

**✅ Why this happens:** JavaScript closures capture variables by reference at creation time. React's `useState` doesn't mutate the captured variable — it creates **new state for the next render**. Each render's closure is a snapshot. The `setInterval` callback was created during the mount render, so its `count` is permanently `0`.

</div>

<div class="answer-whynot">

**❌ Why Fix 1 isn't always right:** Adding `count` to deps creates/destroys the interval on every count change — you get a new interval every click. For a simple log this is fine, but for production timers (audio, games, animations) this restart causes jitter. Fix 2 (ref pattern) gives you a stable interval with always-current data.

</div>

---

## 🎯 TRICK: Automatic Batching — React 18

> **Why doesn't React batch state updates inside setTimeout in React 17?**

<div class="q-badges">
  <span class="badge badge-trick">🎯 Trick</span>
  <span class="badge badge-maang">MAANG</span>
  <span class="badge badge-new">React 18</span>
</div>

::: danger Know the version boundary
Interviewers LOVE this. Getting the React 17 vs 18 distinction right is an instant senior signal.
:::

**React 17 and below:** Batching only happened inside React synthetic event handlers. `setTimeout`, Promises, and native event listeners each caused an immediate re-render per `setState`.

**React 18 with `createRoot`:** All state updates are batched automatically — everywhere.

```jsx
// React 17 — 2 renders
setTimeout(() => {
  setA(1); // render 1 triggered immediately
  setB(2); // render 2 triggered immediately
}, 1000);

// React 18 with createRoot — 1 render
setTimeout(() => {
  setA(1);
  setB(2); // Batched → single render
}, 1000);

// Force synchronous flush when you NEED intermediate DOM state
import { flushSync } from 'react-dom';

flushSync(() => setA(1)); // DOM updated immediately
// Now measure DOM...
flushSync(() => setB(2)); // DOM updated again
```

<div class="answer-why">

**✅ Why React 18 changed this:** React 18's concurrent scheduler treats all updates as potential candidates for batching, regardless of origin. The old behavior was a limitation of how React hooked into the event system. `createRoot` opts you into the new model entirely.

</div>

<div class="answer-whynot">

**❌ Why NOT use `flushSync` everywhere:** `flushSync` forces synchronous work and blocks the main thread — it defeats the purpose of React 18's concurrent rendering. Only use it when you genuinely need to read the DOM between two state updates (e.g., animating between positions, measuring layout after state change).

</div>
