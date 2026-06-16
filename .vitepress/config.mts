import { defineConfig } from "vitepress";

export default defineConfig({
  title: "React Interview Guide 2026",
  description: "Basics to Architectural — WITCH · MAANG · Big4 Edition",
  base: "/react-interview-guide/",

  head: [
    [
      "link",
      {
        rel: "icon",
        href: "/react-interview-guide/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    ["meta", { name: "theme-color", content: "#6c63ff" }],
    ["meta", { property: "og:title", content: "React Interview Guide 2026" }],
    [
      "meta",
      {
        property: "og:description",
        content: "Basics to Architectural — WITCH · MAANG · Big4",
      },
    ],
  ],

  themeConfig: {
    logo: { src: "/logo.svg", alt: "React" },

    nav: [
      { text: "🏠 Home", link: "/" },
      { text: "⚛️ Core", link: "/guide/01-fundamentals" },
      { text: "🪝 Hooks", link: "/guide/02-hooks" },
      { text: "🏗️ Arch", link: "/guide/05-architecture" },
      {
        text: "2026 Topics",
        items: [
          { text: "🚀 RSC & React 19", link: "/guide/06-rsc-react19" },
          { text: "🗂️ State Management", link: "/guide/03-state" },
          { text: "⚡ Performance", link: "/guide/04-performance" },
        ],
      },
    ],

    sidebar: [
      {
        text: "🗺️ Overview",
        items: [
          { text: "How to Use This Guide", link: "/" },
          { text: "Interview Cheatsheet", link: "/guide/cheatsheet" },
        ],
      },
      {
        text: "⚛️ Core Fundamentals",
        collapsed: false,
        items: [
          {
            text: "Virtual DOM & Reconciliation",
            link: "/guide/01-fundamentals#virtual-dom-reconciliation",
          },
          {
            text: "Controlled vs Uncontrolled",
            link: "/guide/01-fundamentals#controlled-vs-uncontrolled",
          },
          {
            text: "useMemo vs useCallback",
            link: "/guide/01-fundamentals#usememo-vs-usecallback",
          },
          {
            text: "🎯 Trick: Stale Closure",
            link: "/guide/01-fundamentals#trick-stale-closure-in-useeffect",
          },
          {
            text: "🎯 Trick: Batching in React 18",
            link: "/guide/01-fundamentals#trick-automatic-batching-react-18",
          },
        ],
      },
      {
        text: "🪝 Hooks Deep Dive",
        collapsed: false,
        items: [
          {
            text: "Rules of Hooks — The Why",
            link: "/guide/02-hooks#rules-of-hooks-and-why-they-exist",
          },
          {
            text: "useEffect vs useLayoutEffect",
            link: "/guide/02-hooks#useeffect-vs-uselayouteffect",
          },
          {
            text: "🎯 Trick: Infinite Loop Hook",
            link: "/guide/02-hooks#trick-infinite-loop-in-custom-hook",
          },
          {
            text: "useRef Hidden Powers",
            link: "/guide/02-hooks#useref-beyond-dom-refs",
          },
          {
            text: "useTransition vs useDeferredValue",
            link: "/guide/02-hooks#usetransition-vs-usedeferredvalue-react-18",
          },
        ],
      },
      {
        text: "🗂️ State Management",
        collapsed: true,
        items: [
          {
            text: "Context vs Redux vs Zustand vs Jotai",
            link: "/guide/03-state#context-api-vs-redux-vs-zustand-vs-jotai",
          },
          {
            text: "🎯 Trick: Context Performance",
            link: "/guide/03-state#trick-context-api-performance-trap",
          },
          {
            text: "TanStack Query vs Redux",
            link: "/guide/03-state#tanstack-query-and-server-state",
          },
        ],
      },
      {
        text: "⚡ Performance",
        collapsed: true,
        items: [
          {
            text: "React.memo + useMemo + useCallback",
            link: "/guide/04-performance#reactmemo-usememo-usecallback-when-they-actually-help",
          },
          {
            text: "🎯 Trick: memo Doesn't Stop All Renders",
            link: "/guide/04-performance#trick-does-reactmemo-prevent-all-re-renders",
          },
          {
            text: "Code Splitting & Suspense",
            link: "/guide/04-performance#code-splitting-lazy-loading-and-suspense",
          },
          {
            text: "Virtualization & List Perf",
            link: "/guide/04-performance#virtualization-and-large-lists",
          },
          {
            text: "Bundle Size Audit Process",
            link: "/guide/07-architect#how-do-you-handle-react-app-bundle-size-at-scale",
          },
        ],
      },
      {
        text: "🏗️ Architecture & Patterns",
        collapsed: true,
        items: [
          {
            text: "Compound Component Pattern",
            link: "/guide/05-architecture#compound-component-pattern",
          },
          {
            text: "Render Props → Hooks",
            link: "/guide/05-architecture#render-props-pattern-and-evolution-to-hooks",
          },
          {
            text: "Scale: MFE, Monorepo, Feature Flags",
            link: "/guide/05-architecture#scale-feature-flags-micro-frontends-monorepo",
          },
          {
            text: "🎯 Trick: When NOT to Use React",
            link: "/guide/05-architecture#trick-when-would-you-not-use-react",
          },
        ],
      },
      {
        text: "🚀 React 18 / 19 & RSC",
        collapsed: true,
        items: [
          {
            text: "React Server Components",
            link: "/guide/06-rsc-react19#react-server-components-rsc",
          },
          {
            text: "React 19: Actions, useOptimistic, use()",
            link: "/guide/06-rsc-react19#react-19-actions-useoptimistic-use",
          },
          {
            text: "🎯 Trick: Hydration Mismatch",
            link: "/guide/06-rsc-react19#trick-hydration-and-hydration-mismatches",
          },
        ],
      },
      {
        text: "🧪 Testing",
        collapsed: true,
        items: [
          {
            text: "Testing Pyramid for React",
            link: "/guide/08-testing#testing-pyramid-for-react",
          },
          {
            text: "🎯 Trick: act() Warnings",
            link: "/guide/08-testing#trick-act-warnings-explained",
          },
        ],
      },
      {
        text: "🧠 Senior / Architect",
        collapsed: true,
        items: [
          {
            text: "Real-time Collab Architecture",
            link: "/guide/07-architect#design-a-real-time-collaborative-react-app",
          },
          {
            text: "Bundle Size Audit at Scale",
            link: "/guide/07-architect#how-do-you-handle-react-app-bundle-size-at-scale",
          },
          {
            text: '🎯 Trick: "Make It Faster"',
            link: "/guide/07-architect#trick-make-this-react-app-faster",
          },
          {
            text: "Error Boundaries Full Picture",
            link: "/guide/07-architect#error-boundaries-full-usage-and-react-19",
          },
        ],
      },
    ],

    search: {
      provider: "local",
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/sehgalrishabh/react-interview-guide",
      },
    ],

    footer: {
      message: "React Interview Master Guide · 2026 Edition",
      copyright: "Built for WITCH · MAANG · Big4 prep",
    },

    editLink: {
      pattern:
        "https://github.com/sehgalrishabh/react-interview-guide/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    lastUpdated: {
      text: "Last Updated",
      formatOptions: { dateStyle: "medium" },
    },
  },

  markdown: {
    theme: {
      light: "github-light",
      dark: "one-dark-pro",
    },
    lineNumbers: true,
  },
});
