# Cleverly UI/UX Spec (Psychology-Informed)

Role: Senior Product Designer + Behavioral Psychologist  
Goal: Minimize cognitive load, speed grading, signal reliability, make insights rewarding, and keep strong visual identity.

## 1) Courses / Graders Hub (Hick’s Law)
- **Smart sorting:** Order by `status=grading` → `upcoming test date` → `recently opened`. Quick filter pills: `Active`, `Upcoming`, `Recent`.
- **Card info density:** Title, subject badge, next test date, status pill, “last opened” timestamp. Limit visible actions to 1 primary (“Open”) + 1 secondary (“Analytics”).
- **Compact list toggle:** Switch between grid (rich preview) and compact list (dense rows) to shrink choice set.

```
┌──────────────────────────────────────────────────────────┐
│ Filters: [Active] [Upcoming] [Recent] [All]              │
├──────────────────────────────────────────────────────────┤
│ Calc Midterm 1   • Calculus • Grading        Open ▸       │
│ Status: GRADING (75%)   Next: Apr 12   Last opened: 2h    │
├──────────────────────────────────────────────────────────┤
│ Mechanics Quiz    • Mechanics • Ready         Open ▸      │
│ Status: READY     Next: Apr 18   Last opened: 1d           │
└──────────────────────────────────────────────────────────┘
```

## 2) Split-Screen Grading (Fitts’ Law)
- **Thumb/keyboard zone:** Pin “Prev/Next student”, “Override”, “Flag” in a fixed bottom-right tray; map shortcuts (P/N/O/F).
- **Large targets:** Score inputs ≥44px height; accordion headers full-width tap targets.
- **Low travel:** Keep rubric/question list left, PDF/answer view right; tray remains sticky.

```
┌───────────────┬────────────────────────────────────────┐
│ Questions     │ PDF / Answer Viewer                    │
│ [Q1 4/5] ▼    │                                        │
│ [Q2 8/10] ▼   │                                        │
│ [Q3 … ]       │                                        │
└───────────────┴────────────────────────────────────────┘
           [Prev] [Next] [Override] [Flag]  (sticky tray)
           Shortcuts: P / N / O / F
```

## 3) Status & Offline/Queue Anxiety
- **Persistent status pill per grader:** `Ready`, `Syncing`, `Offline-ready`, `Error`. Include last-sync time.
- **Job progress:** Upload → Embedding → Rubric → Grading bars with percentage + “in queue” label.
- **Offline reassurance:** Toast “Stored locally • usable offline” after uploads; cached count in settings.

```
[Grading Ready • Last sync 2m ago]   Upload ▓▓▓▓▓░ 80% (queue: 3)
[Offline-ready • Cached 12 files]    Embedding ▓▓░░ 45%
```

## 4) Variable Rewards for Insights
- **Staggered reveals:** “Top 3 improvements” cards animate in; “High-confidence wins” badge; “Low-confidence flags” accordion.
- **Micro-goals:** “Reviewed 2/3” progress; unlock “Export PDF/XLS” badge when all cards are viewed.
- **Refreshing novelty:** Daily rotation of insights ordering to keep engagement.

```
Top Improvements (2/3 reviewed)  ▓▓▓░
▣ Clarify chain rule (Conf 0.62)   [Mark reviewed]
▣ Show work on integrals (Conf 0.55)

High-confidence wins: Derivatives mastery (0.91)   [Export badge unlocked]
```

## 5) Visual Familiarity / Mental Models
- **Subject color system:** Calculus=teal, Mechanics=amber, Physics=violet, Linear Algebra=indigo, Stats=green.
- **Consistent layout:** Title → status pill → marks; memo/test thumbnail on the right. Rubric rows align question number, expected answer, marks column.
- **Branding cues:** Keep PDF thumbnails and iconography consistent; avoid palette drift to preserve quick recognition.

```
┌ Calc Midterm 1 ── [GRADING] ── 100 marks ── (thumb) ┐
```

## Interaction Checklist
- Sorting + filter pills; grid/list toggle.
- Sticky grading tray with shortcuts; large tap targets.
- Status pills + progress bars + last sync + offline toasts.
- Insight cards with reveal animation and completion badge.
- Subject color tokens + consistent card/row layouts.
