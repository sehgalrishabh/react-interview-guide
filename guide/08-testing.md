# 🧪 Testing

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

---

## Testing Pyramid for React

> **What is your testing strategy for a React application?**

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
  <span class="badge badge-witch">WITCH</span>
</div>

The testing pyramid for React in 2026:

```
          /‾‾‾‾‾‾‾‾‾‾\
         /   E2E Tests  \      ← Few, slow, high confidence
        /   (Playwright) \       Critical user journeys only
       /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
      /  Integration Tests  \  ← Middle layer
     /   (RTL + MSW/Vitest)  \   Component + real children + mocked API
    /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
   /        Unit Tests          \ ← Many, fast, isolated
  /  (Jest/Vitest + RTL hooks)   \  Custom hooks, utils, reducers, pure fns
 /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
```

**Core philosophy — React Testing Library:**

> "The more your tests resemble the way your software is used, the more confidence they give you." — Kent C. Dodds

**Test what users see and do, not internal implementation.**

```jsx
// ✅ GOOD — tests user behaviour (survives refactors)
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../mocks/server"; // MSW server
import { http, HttpResponse } from "msw";

test("user can log in with valid credentials", async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  // Query by what user sees — accessible queries preferred
  await user.type(
    screen.getByLabelText("Email address"),
    "rishabh@example.com",
  );
  await user.type(screen.getByLabelText("Password"), "securePass123");
  await user.click(screen.getByRole("button", { name: /sign in/i }));

  // Assert what user experiences
  expect(await screen.findByText("Welcome back, Rishabh!")).toBeInTheDocument();
  expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
});

test("shows error message on invalid credentials", async () => {
  // Override MSW handler for this test
  server.use(
    http.post("/api/auth/login", () => {
      return HttpResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }),
  );

  const user = userEvent.setup();
  render(<LoginPage />);

  await user.type(screen.getByLabelText("Email address"), "wrong@example.com");
  await user.type(screen.getByLabelText("Password"), "wrongpassword");
  await user.click(screen.getByRole("button", { name: /sign in/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Invalid credentials",
  );
});

// ❌ BAD — tests implementation details (breaks on refactors)
test("setState is called with email value", () => {
  const wrapper = shallow(<LoginForm />);
  wrapper.find('input[name="email"]').simulate("change", {
    target: { value: "test@test.com" },
  });
  expect(wrapper.state("email")).toBe("test@test.com"); // Enzyme-style — avoid
});
```

### Unit Testing Custom Hooks

```jsx
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

test("useCounter increments correctly", () => {
  const { result } = renderHook(() => useCounter(0));

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});

test("useCounter respects max value", () => {
  const { result } = renderHook(() => useCounter(0, { max: 5 }));

  act(() => {
    for (let i = 0; i < 10; i++) result.current.increment();
  });

  expect(result.current.count).toBe(5); // Capped at max
});
```

### E2E with Playwright

```typescript
// playwright/tests/checkout.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Checkout flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products");
  });

  test("user can complete purchase", async ({ page }) => {
    // Add to cart
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await page.getByRole("link", { name: "Cart (1)" }).click();

    // Fill checkout form
    await page.getByLabel("Card number").fill("4242 4242 4242 4242");
    await page.getByLabel("Expiry").fill("12/28");
    await page.getByLabel("CVC").fill("123");

    await page.getByRole("button", { name: "Pay Now" }).click();

    // Assert success
    await expect(page.getByText("Order confirmed!")).toBeVisible();
    await expect(page.getByText("Order #")).toBeVisible();
  });

  test("shows error on declined card", async ({ page }) => {
    // Stripe test card for decline
    await page.getByLabel("Card number").fill("4000 0000 0000 0002");
    // ...
    await expect(page.getByRole("alert")).toContainText(
      "Your card was declined",
    );
  });
});
```

### MSW (Mock Service Worker) — API Mocking

```typescript
// mocks/handlers.ts — shared between unit and E2E tests
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/user/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: "Rishabh",
      role: "admin",
    });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const body = await request.json();
    if (body.email === "test@test.com" && body.password === "correct") {
      return HttpResponse.json({ token: "mock-jwt-token" });
    }
    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),
];

// mocks/server.ts — Node environment (Jest/Vitest)
import { setupServer } from "msw/node";
export const server = setupServer(...handlers);

// mocks/browser.ts — Browser environment (Playwright, Storybook)
import { setupWorker } from "msw/browser";
export const worker = setupWorker(...handlers);
```

<div class="answer-why">

**✅ Why RTL's philosophy wins:** Implementation tests (testing internal state, method calls, component structure) break on **every refactor** even when behaviour is correct. They slow teams down and erode trust in the test suite. Behaviour tests survive internal restructuring — they only break when actual functionality breaks. This is the definition of tests that give confidence.

</div>

<div class="answer-whynot">

**❌ Why NOT chase 100% coverage:** Coverage is a vanity metric when tests are implementation-coupled. 100% coverage with shallow/Enzyme-style tests gives false confidence and slows development. Focus coverage effort on: authentication flows, payment processing, data submission, and user-facing error states. These are the paths where bugs cause real harm.

</div>

---

## 🎯 TRICK: act() Warnings Explained

> **What does "Warning: An update was not wrapped in act()" mean and how do you fix it?**

<div class="q-badges">
  <span class="badge badge-trick">🎯 Trick</span>
  <span class="badge badge-maang">MAANG</span>
</div>

::: danger Misunderstood by Most Developers
Most developers suppress this warning or add random `act()` wrappers without understanding why it appears. Explaining it correctly is an instant senior signal.
:::

**`act()`** wraps code that causes React state updates, ensuring all state updates, effects, and re-renders are processed and the DOM is updated before assertions run.

RTL's `render`, `userEvent`, `fireEvent`, `findBy*`, and `waitFor` are all **already wrapped in `act()` internally**. The warning appears when an **async state update happens OUTSIDE of act()** — typically after the test has already made assertions.

```jsx
// ❌ Warning: An update was not wrapped in act()
test("loads user data", () => {
  render(<UserProfile userId="1" />);
  // Component has useEffect that fetches user and calls setUser
  // Test ends here → component is unmounted
  // → useEffect's fetch resolves AFTER test ends
  // → setUser called on unmounted component
  // → React warns: update outside act()

  expect(screen.getByText("Loading...")).toBeInTheDocument(); // Passes
  // But the async update happens after test ends → warning
});
```

```jsx
// ✅ FIX 1: findBy* — automatically waits + is wrapped in act()
test("loads user data", async () => {
  render(<UserProfile userId="1" />);

  // findByText waits up to 1000ms (configurable) for element to appear
  // It polls getByText, wrapped in act() on each attempt
  expect(await screen.findByText("Rishabh")).toBeInTheDocument();
  // No warning — async update happened before assertion
});

// ✅ FIX 2: waitFor — for non-element async assertions
test("calls onSuccess after form submit", async () => {
  const onSuccess = jest.fn();
  const user = userEvent.setup();
  render(<ContactForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText("Email"), "test@test.com");
  await user.click(screen.getByRole("button", { name: "Submit" }));

  // waitFor polls until assertion passes or times out
  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalledWith({ email: "test@test.com" });
  });
});

// ✅ FIX 3: Mock timers when using setTimeout/setInterval
test("shows success message after delay", async () => {
  jest.useFakeTimers();
  render(<SaveButton />);

  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // Advance fake timer
  act(() => {
    jest.advanceTimersByTime(2000);
  });

  expect(screen.getByText("Saved!")).toBeInTheDocument();
  jest.useRealTimers();
});
```

**Query priority — RTL best practices:**

```jsx
// Use in this priority order (most accessible → least)
screen.getByRole("button", { name: /submit/i }); // 1st — accessible
screen.getByLabelText("Email address"); // 2nd — form labels
screen.getByPlaceholderText("Search..."); // 3rd — placeholder
screen.getByText("Submit"); // 4th — text content
screen.getByDisplayValue("current value"); // 5th — form values
screen.getByAltText("Profile photo"); // 6th — img alt
screen.getByTitle("Close modal"); // 7th — title attr
screen.getByTestId("submit-btn"); // Last resort — data-testid

// Why this order: testing by role/label = testing accessibility too.
// If your test uses getByRole and it works, your app is accessible.
// If you need getByTestId everywhere, your app likely has accessibility issues.
```

<div class="answer-why">

**✅ Why RTL's async utilities handle act() for you:** RTL's design is that `findBy*` and `waitFor` handle the async → act() wrapping automatically. The warning appears specifically when YOU trigger async updates that React can't batch — like a `fetch` in `useEffect` that resolves after the test's synchronous assertions. The fix is always: wait for the async result before asserting.

</div>

<div class="answer-whynot">

**❌ Why NOT wrap everything manually in `act()`:** Manual `act()` wrapping is a code smell — it means you're fighting React's testing model instead of working with it. RTL's async utilities (`findBy*`, `waitFor`, `userEvent`) handle this correctly. The one legitimate use of manual `act()` is with fake timers — advancing `jest.advanceTimersByTime()` that triggers state updates must be wrapped in `act()`.

</div>
