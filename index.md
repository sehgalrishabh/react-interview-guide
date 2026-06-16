---
layout: home

hero:
  name: "React Interview Guide"
  text: "Basics → Architectural"
  tagline: "The only SSOT you need for WITCH · MAANG · Big4 prep in 2026. Every question answered with ✅ Why correct + ❌ Why not otherwise."
  image:
    src: /logo.svg
    alt: React
  actions:
    - theme: brand
      text: Start with Core Fundamentals →
      link: /guide/01-fundamentals
    - theme: alt
      text: Architect Questions
      link: /guide/07-architect
    - theme: alt
      text: Quick Cheatsheet
      link: /guide/cheatsheet

features:
  - icon: 🎯
    title: Trick Questions Flagged
    details: Every classic interview trap is marked and explained — stale closures, batching gotchas, memo limitations, hydration mismatches, and more.

  - icon: ✅
    title: Answer + Why + Why Not
    details: Every question has the correct answer, why it's correct, and explicitly why the alternative is wrong. No vague explanations.

  - icon: 🏗️
    title: Architectural Depth
    details: Goes beyond hooks — compound patterns, micro-frontends, Module Federation, Y.js/CRDT real-time, bundle auditing, RSC architecture.

  - icon: 🚀
    title: 2026 Ready
    details: Covers React 19 Actions, useOptimistic, Server Components, INP (replaced FID), TanStack Query paradigm, Concurrent Mode internals.

  - icon: 🗂️
    title: SSOT Structure
    details: 8 sections, 30+ questions, cross-linked sidebar. Searchable. Use it as your daily revision companion before interviews.

  - icon: 🧠
    title: Senior/Architect Signals
    details: Every answer includes what signals seniority to the interviewer — the framing, trade-off thinking, and when NOT to use a pattern.
---

<div style="max-width: 860px; margin: 3rem auto; padding: 0 1.5rem;">

## How to Use This Guide

This is your **Single Source of Truth** for React interview prep. Not a list of definitions — every question includes:

| Section | What it covers |
|---|---|
| **Answer** | The correct, complete answer |
| **✅ Why correct** | The underlying reasoning — what the interviewer is testing |
| **❌ Why not otherwise** | Why the alternative answer fails |
| **🎯 Trick Alert** | When it's a classic trap, flagged explicitly |
| **🏗️ Architect Signal** | What phrasing/framing shows seniority |

## Coverage at a Glance

<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-num">8</div>
    <div class="stat-label">Sections</div>
  </div>
  <div class="stat-card">
    <div class="stat-num">30+</div>
    <div class="stat-label">Questions</div>
  </div>
  <div class="stat-card">
    <div class="stat-num">12</div>
    <div class="stat-label">Trick Qs</div>
  </div>
  <div class="stat-card">
    <div class="stat-num">2026</div>
    <div class="stat-label">React 19 Ready</div>
  </div>
</div>

## Recommended Study Order

**For WITCH (service companies) — 3 days:**
1. [Core Fundamentals](/guide/01-fundamentals) — Day 1 morning
2. [Hooks Deep Dive](/guide/02-hooks) — Day 1 afternoon
3. [State Management](/guide/03-state) — Day 2
4. [Performance](/guide/04-performance) — Day 3
5. [Cheatsheet](/guide/cheatsheet) — Night before

**For MAANG / Big4 (product/tech companies) — 7 days:**
- Days 1–3: All of the above
- Day 4: [Architecture & Patterns](/guide/05-architecture)
- Day 5: [RSC & React 19](/guide/06-rsc-react19)
- Day 6: [Senior/Architect Questions](/guide/07-architect)
- Day 7: [Testing](/guide/08-testing) + full revision

::: tip Focus on "Why"
Interviewers at MAANG don't just want you to know what `useMemo` does. They want to hear you say "but the memoization itself has overhead, so I'd profile first." The **Why** sections in this guide are what separate senior from mid-level answers.
:::

</div>
