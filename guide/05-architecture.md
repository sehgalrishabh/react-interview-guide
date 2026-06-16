# 🏗️ Architecture & Patterns

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

---

## Compound Component Pattern

> **What is the Compound Component pattern and when should you use it?**

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

Compound components share **implicit state through Context**, giving consumers flexible composition without prop drilling. Think of native HTML `<select>` + `<option>` — they share state implicitly. This pattern brings that model to React.

```jsx
// ❌ Prop-drilling approach — parent needs to know everything
<Tabs
  tabs={["Profile", "Settings"]}
  panels={[<ProfileContent />, <SettingsContent />]}
  defaultTab={0}
  tabClassName="tab"
  panelClassName="panel"
  activeTabClassName="tab--active"
  onTabChange={handleChange}
  renderTab={(label, isActive) => <span>{label}</span>}
  // ... prop explosion continues
/>;

// ✅ Compound Component — consumers control layout and rendering
const TabsContext = createContext();

function Tabs({ children, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs-root">{children}</div>
    </TabsContext.Provider>
  );
}

// Sub-components attached as static properties
Tabs.List = function TabList({ children }) {
  return (
    <div role="tablist" className="tab-list">
      {children}
    </div>
  );
};

Tabs.Tab = function Tab({ id, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={`tab ${isActive ? "tab--active" : ""}`}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function Panel({ id, children }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== id) return null;
  return <div role="tabpanel">{children}</div>;
};

// Consumer — full layout control, zero prop drilling
<Tabs defaultTab="profile">
  <Tabs.List>
    <Tabs.Tab id="profile">👤 Profile</Tabs.Tab>
    <Tabs.Tab id="settings">⚙️ Settings</Tabs.Tab>
    <Tabs.Tab id="billing">💳 Billing</Tabs.Tab>
  </Tabs.List>

  {/* Consumer controls layout between tabs and panels */}
  <hr />

  <Tabs.Panel id="profile">
    <ProfileContent />
  </Tabs.Panel>
  <Tabs.Panel id="settings">
    <SettingsContent />
  </Tabs.Panel>
  <Tabs.Panel id="billing">
    <BillingContent />
  </Tabs.Panel>
</Tabs>;
```

**Real-world compound component libraries:**

- Radix UI — `<Select.Root>`, `<Select.Trigger>`, `<Select.Content>`
- Headless UI — `<Disclosure>`, `<Disclosure.Button>`, `<Disclosure.Panel>`
- Reach UI — same pattern throughout

<div class="answer-why">

**✅ Why compound components win for reusable UI libraries:** Consumers get **full rendering control** — they decide the layout, the order, what goes between tabs and panels. The parent doesn't need to enumerate every possible customisation via props. This is the difference between a rigid API and a composable one. Radix UI, the most popular headless component library in 2026, is built entirely on this pattern.

</div>

<div class="answer-whynot">

**❌ Why NOT use compound components for simple, stateless widgets:** A `<Card>`, `<Avatar>`, or `<Badge>` doesn't need shared state between sub-components — compound pattern adds Context overhead for no benefit. Use it when you have **multiple related sub-components that share state** and consumers need **layout flexibility**.

</div>

---

## Render Props Pattern and Evolution to Hooks

> **What is the Render Props pattern and how did it evolve into hooks?**

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

Render props share **stateful logic** between components by passing a function as a prop that returns JSX. The component provides data/behaviour; the consumer controls rendering.

```jsx
// Classic render prop (pre-hooks era)
class MouseTracker extends React.Component {
  state = { x: 0, y: 0 };

  handleMouseMove = (e) => {
    this.setState({ x: e.clientX, y: e.clientY });
  };

  render() {
    return (
      <div style={{ height: "100vh" }} onMouseMove={this.handleMouseMove}>
        {this.props.render(this.state)} {/* Inversion of rendering control */}
      </div>
    );
  }
}

// Usage
<MouseTracker
  render={({ x, y }) => (
    <div>
      Mouse at {x}, {y}
    </div>
  )}
/>;

// ✅ Modern hook equivalent — logic sharing without render control
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return pos;
}
// Consumer renders wherever it wants — no JSX wrapper needed
const { x, y } = useMousePosition();
```

**When render props STILL win over hooks (2026):**

```jsx
// Render props for RENDERING CONTROL — hooks can't do this
// react-window, react-table, downshift all use render props

// ✅ react-window — only render props can inject the style correctly
<FixedSizeList height={600} itemCount={1000} itemSize={50}>
  {({ index, style }) => (
    // Consumer decides HOW to render each row — library provides style/index
    <div style={style} className={index % 2 === 0 ? 'even' : 'odd'}>
      Row {index}
    </div>
  )}
</FixedSizeList>

// ✅ Downshift — render prop for full custom dropdown UI
<Combobox onSelectedItemChange={({ selectedItem }) => setValue(selectedItem)}>
  {({ getInputProps, getMenuProps, getItemProps, isOpen }) => (
    <div>
      <input {...getInputProps()} />
      <ul {...getMenuProps()}>
        {isOpen && items.map((item, i) => (
          <li key={item.id} {...getItemProps({ item, index: i })}>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )}
</Combobox>
```

<div class="answer-why">

**✅ Why hooks replaced render props for logic sharing:** Hooks compose horizontally — `const pos = useMousePosition(); const { user } = useAuth();`. Render props compose vertically (nesting), creating "callback hell in JSX" when multiple render props are composed. Hooks are cleaner for pure logic extraction.

</div>

<div class="answer-whynot">

**❌ Why render props aren't dead:** Hooks can share logic, but they **cannot control where JSX renders in the tree**. When a library needs to inject positioning style, provide accessibility attributes, or control the DOM structure around the consumer's content, render props are the only clean solution. This is why all major headless UI libraries still use them.

</div>

---

## Scale: Feature Flags, Micro-frontends, Monorepo

> **How do you architect React at scale — feature flags, micro-frontends, monorepos?**

<div class="q-badges">
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-new">2026</span>
  <span class="badge badge-maang">MAANG</span>
</div>

### Feature Flags

```jsx
// Feature flag hook — wraps LaunchDarkly / Unleash / custom
function useFeatureFlag(flag) {
  const flags = useContext(FeatureFlagContext);
  return flags[flag] ?? false; // Default false (safe fallback)
}

// Usage — gradual rollout without deploy
function Checkout() {
  const hasNewPaymentUI = useFeatureFlag("new-payment-ui-v2");
  return hasNewPaymentUI ? <NewPaymentForm /> : <LegacyPaymentForm />;
}

// Provider — fetch flags once at app boot
function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState({});
  useEffect(() => {
    flagService.fetchAll(userId).then(setFlags);
  }, [userId]);
  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}
```

### Micro-frontends with Module Federation

```js
// webpack.config.js — Shell app (host)
new ModuleFederationPlugin({
  name: "shell",
  remotes: {
    // Each team owns a separate deployed React app
    checkout: "checkout@https://checkout.company.com/remoteEntry.js",
    catalog: "catalog@https://catalog.company.com/remoteEntry.js",
    profile: "profile@https://profile.company.com/remoteEntry.js",
  },
  shared: {
    react: { singleton: true, requiredVersion: "^18.0.0" },
    "react-dom": { singleton: true },
  },
});

// Shell app — loads remote components at runtime
const CheckoutApp = lazy(() => import("checkout/App"));
const CatalogApp = lazy(() => import("catalog/ProductGrid"));

// Teams deploy independently — no monorepo coordination needed
```

### Monorepo with Turborepo

```
company-frontend/
├── apps/
│   ├── web/          # Main Next.js app
│   ├── mobile/       # React Native
│   └── admin/        # Internal tools
├── packages/
│   ├── ui/           # @company/ui — design system
│   ├── hooks/        # @company/hooks — shared custom hooks
│   ├── utils/        # @company/utils — pure functions
│   └── types/        # @company/types — TypeScript types
├── turbo.json        # Incremental builds — only rebuild changed packages
└── pnpm-workspace.yaml
```

```bash
# Only rebuilds affected packages
turbo run build --filter=[HEAD^1]
# Caches build artifacts — CI goes from 15min → 2min on cache hit
```

<div class="answer-why">

**✅ Why these matter at MAANG scale:** Feature flags decouple **deploy from release** — critical for trunk-based development where 100s of engineers push to main daily. Module Federation enables **independent team deployment** without coordinating a monorepo release. Turborepo's **incremental builds** make monorepos practical — building only changed packages instead of everything.

</div>

<div class="answer-whynot">

**❌ Why NOT micro-frontends by default:** MFE adds massive operational complexity — shared dependency version conflicts (two React versions = disaster), cross-app communication via custom events or a shared bus, auth token sharing across origins (CORS), route coordination. Only adopt MFE when teams have **clear ownership boundaries** and genuinely need **independent deployment schedules**. For most companies, a well-structured monorepo is the right choice.

</div>

---

## 🎯 TRICK: When Would You NOT Use React?

> **A CTO asks: "Should we use React for everything?" How do you respond?**

<div class="q-badges">
  <span class="badge badge-trick">🎯 Trick</span>
  <span class="badge badge-arch">🏗 Arch</span>
  <span class="badge badge-maang">MAANG</span>
</div>

::: danger Senior Signal Question
This is specifically designed to see if you think in tools vs problems, or if you have framework Stockholm syndrome. The wrong answer is "yes, React for everything." The right answer shows you understand trade-offs.
:::

**When React is the wrong tool:**

```
❌ Static marketing site with no interactivity
   → Use: Astro, Hugo, plain HTML
   → Why: React runtime (45KB+) is dead weight for static content
          Astro ships zero JS by default

❌ Document-heavy SEO site (blogs, news, docs)
   → Use: Astro + islands, Next.js SSG (if you need React elsewhere)
   → Why: Minimal interactivity doesn't justify VDOM overhead

❌ Simple CRUD with server-rendered forms
   → Use: HTMX + any backend, Rails/Django with Hotwire
   → Why: React replaces what the server was doing fine for free

❌ High-performance 60fps game or canvas UI
   → Use: Direct Canvas/WebGL, Pixi.js, Three.js without React wrapper
   → Why: React's reconciler runs on every frame update — adds ~2ms overhead
          Game loops need deterministic, zero-overhead rendering

❌ Tiny embeddable widget (price ticker, chat bubble)
   → Use: Vanilla JS, Svelte, or Preact (3KB vs React's 45KB)
   → Why: React runtime is larger than the widget itself

❌ Native mobile with heavy animations
   → Use: Flutter (superior animation performance), or native Swift/Kotlin
   → Why: React Native bridges JS-to-Native — animation at 60fps is harder
          Flutter compiles to native ARM directly
```

```
✅ React IS the right tool for:
   - SPAs with complex interactive state
   - Large teams needing typed component contracts
   - Design systems (Storybook + React is the industry standard)
   - Applications with drag-drop, real-time, rich data tables
   - Full-stack with Next.js (SSR + RSC is genuinely excellent)
   - Teams that need the largest hiring pool
```

<div class="answer-why">

**✅ Why this is the senior answer:** Framework-agnostic thinking is what separates tech leads from senior developers. Interviewers at MAANG/Big4 are specifically checking if you can defend technology choices with trade-off analysis, not just default to what you know. Saying "React for everything" signals you haven't thought deeply about problem-tool fit.

</div>

<div class="answer-whynot">

**❌ Why NOT overcorrect and dismiss React:** React is the most battle-tested UI framework with the largest ecosystem, the best TypeScript support, the richest tooling, and the largest hiring pool. The point isn't to avoid React — it's to know precisely when another tool solves the problem better. In most product company contexts, React is the correct default.

</div>
