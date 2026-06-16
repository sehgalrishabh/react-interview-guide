# ⚛️ React Interview Guide 2026

> **Single Source of Truth** for React interview prep — Basics to Architectural.
> Built with VitePress. Deployable from a phone. No laptop needed.

<div align="center">

![VitePress](https://img.shields.io/badge/VitePress-1.3.4-6c63ff?style=flat-square&logo=vite)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![License](https://img.shields.io/badge/License-MIT-00d4aa?style=flat-square)
![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Pages-ff6b6b?style=flat-square&logo=github)

**[🚀 View Live Site](https://YOUR_USERNAME.github.io/react-interview-guide/)** &nbsp;·&nbsp;
**[📖 Start Reading](https://YOUR_USERNAME.github.io/react-interview-guide/guide/01-fundamentals)**

</div>

---

## What's Inside

| Section               | Topics                                                                              | Questions |
| --------------------- | ----------------------------------------------------------------------------------- | --------- |
| ⚛️ Core Fundamentals  | VDOM, Reconciliation, Controlled vs Uncontrolled, useMemo vs useCallback            | 5         |
| 🪝 Hooks Deep Dive    | Rules of Hooks, useEffect vs useLayoutEffect, stale closures, useRef, useTransition | 5         |
| 🗂️ State Management   | Context vs Redux vs Zustand vs Jotai, TanStack Query, server state                  | 3         |
| ⚡ Performance        | React.memo, virtualization, code splitting, bundle audit                            | 4         |
| 🏗️ Architecture       | Compound components, render props, micro-frontends, Module Federation               | 4         |
| 🚀 React 18/19 & RSC  | Server Components, Actions, useOptimistic, hydration mismatches                     | 3         |
| 🧪 Testing            | RTL philosophy, testing pyramid, act() warnings                                     | 2         |
| 🧠 Senior / Architect | Real-time collab (CRDT/Y.js), bundle auditing, error boundaries                     | 4         |

**30+ questions · 12 trick questions flagged · Every answer has ✅ Why + ❌ Why Not**

---

## Targeted At

- **WITCH** (Wipro, Infosys, TCS, Cognizant, HCL) — Core + Hooks + State sections
- **MAANG / Big4** — All sections including Architecture, RSC, Senior questions
- **2026 ready** — React 19 Actions, INP metric, Server Components, TanStack Query, Y.js

---

## Deploy in 5 Minutes (Phone Only)

No laptop needed. GitHub does the build for you via Actions.

### Step 1 — Fork or create repo

```
github.com → + → New repository → "react-interview-guide" → Public → Create
```

### Step 2 — Upload files

Upload all files from this zip via **Add file → Upload files** on GitHub mobile.

For nested folders (`.vitepress/`, `.github/`), use **Create new file** and type the full path:

```
.vitepress/config.mts        ← paste content
.vitepress/theme/index.ts    ← paste content
.vitepress/theme/custom.css  ← paste content
.github/workflows/deploy.yml ← paste content below
```

### Step 3 — Add the deploy workflow

Create `.github/workflows/deploy.yml` with:

```yaml
name: Deploy VitePress to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### Step 4 — Enable GitHub Pages

```
Repo → Settings → Pages → Source → GitHub Actions → Save
```

### Step 5 — Done

Watch **Actions** tab. In ~2 minutes, live at:

```
https://YOUR_USERNAME.github.io/react-interview-guide/
```

---

## Local Development (when you have a laptop)

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/react-interview-guide.git
cd react-interview-guide

# Install
npm install

# Dev server (localhost:5173)
npm run docs:dev

# Production build
npm run docs:build

# Preview production build
npm run docs:preview
```

---

## Project Structure

```
react-interview-guide/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions — auto build & deploy
├── .vitepress/
│   ├── config.mts              # Sidebar, nav, search, theme config
│   └── theme/
│       ├── index.ts            # Theme entry
│       └── custom.css          # Trick boxes, badges, stat cards
├── guide/
│   ├── 01-fundamentals.md      # Core React
│   ├── 02-hooks.md             # Hooks deep dive
│   ├── 03-state.md             # State management
│   ├── 04-performance.md       # Performance
│   ├── 05-architecture.md      # Patterns & architecture
│   ├── 06-rsc-react19.md       # RSC & React 19
│   ├── 07-architect.md         # Senior / architect questions
│   ├── 08-testing.md           # Testing
│   └── cheatsheet.md           # Quick revision cheatsheet
├── index.md                    # Home page
├── package.json
└── README.md
```

---

## Customizing

**Change the repo base URL** — edit `.vitepress/config.mts`:

```ts
base: '/react-interview-guide/', // ← change to your repo name
```

**Add a question** — open any `.md` file in `guide/`, follow the existing pattern:

```md
## Your Question Title

> **The question as it would be asked in interview**

Answer here...

<div class="answer-why">
**✅ Why correct:** ...
</div>

<div class="answer-whynot">
**❌ Why not:** ...
</div>
```

**Add to sidebar** — edit the `sidebar` array in `.vitepress/config.mts`.

---

## Contributing

PRs welcome. If you've faced a React interview question not covered here, open an issue or PR with the question + answer in the same format.

---

## License

MIT — use it, share it, fork it. Just don't sell it as-is.

---

<div align="center">
Built for the Indian dev community grinding WITCH → MAANG transitions.<br/>
If this helped you crack an interview, drop a ⭐
</div>
