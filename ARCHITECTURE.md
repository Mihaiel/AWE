# React source structure

`js/react/` is organized by feature, not by file type. Each feature folder holds its own page and the components only that feature needs; nothing generic lives inside a feature folder.

```
js/react/
  App.tsx                 shell: owns currentView, decides which page mounts
  main.tsx                entry point, mounts <App /> into react.html
  types.ts                shared types used by the shell (e.g. ViewName)
  KeyDemoThrowaway.tsx    Exercise 4 Demo 4's live-demo-only component, not part of the real app

  shell/                  app chrome, not tied to any one feature
    Header.tsx
    NavBar.tsx

  dashboard/
    DashboardPage.tsx
    CaseSummaryCard.tsx    bakes in the Case's own "FLAGGED"-style status badge

  people-locations/
    PeoplePage.tsx
    PersonCard.tsx          takes a Person
    LocationCard.tsx        takes a Location

  timeline/
    TimelinePage.tsx
    TimelineEventItem.tsx   takes a TimelineEvent
    CertaintyBadge.tsx      renders this app's timeline-only "certainty" vocabulary

  evidence/
    EvidencePage.tsx        stub, out of scope this exercise

  workspace/
    WorkspacePage.tsx       stub, out of scope this exercise

  components/              shared: generic, feature-agnostic building blocks
    Panel.tsx               title + children, no domain knowledge
    TabBar.tsx               generic tabs/activeTab/onChange
    StatCard.tsx             value + label
    ReviewProgressBar.tsx    percent
    MiniListItem.tsx         primaryText/secondaryText/badge
```

## The rule: shared vs. feature-local

A component goes in `components/` (shared) only if it takes purely generic props, no domain type (`Person`, `Location`, `TimelineEvent`, `Evidence`, `Case`) and no feature-specific vocabulary baked into it, so it would make just as much sense in any other feature without being changed. 
Everything else, even something simply *typed* with primitives like `CaseSummaryCard` (whose `title`/`status`/`summary` shape and "FLAGGED" badge are really the Case's own shape, not a generic card), stays inside the one feature that actually needs it.

This is deliberately not "is it currently used by more than one feature" — nothing crosses a feature boundary yet, that's Demo 7's job. Filing an already-generic component as shared now doesn't invent a new abstraction, it just names what's already true about it; it still won't move into `components/` just because it *might* get reused later.
