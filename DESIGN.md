# EmbedLint - Design Document

> **Version:** 1.0.0
> **Philosophy:** _"Blurple-tinted workspace that feels like a Discord dev tool."_

---

## 1. Design Principles

1. **Discord-native, not a Discord clone.** Discord feel (blurple, dark), but clearly an editor tool, not chat.
2. **Editor-first.** Canvas and palette dominate the screen; preview is a companion panel.
3. **Instant feedback.** Every action has a visible consequence within < 100ms.
4. **Errors do not punish.** Show the location + how to fix, not just red.
5. **Keyboard-friendly.** Power users never need the mouse.
6. **Dense but airy.** Information-rich, enough whitespace, never cramped.

---

## 2. Main Layout

### 2.1 Desktop (≥ 1024px)

```
┌───────────────────────────────────────────────────────────────────┐
│  Topbar: Logo EmbedLint · Undo/Redo · Counter · Export · Theme    │
├──────────┬─────────────────────────────────┬──────────────────────┤
│          │                                 │                      │
│ Palette  │           Canvas                │    Preview +         │
│ (240px)  │           (fluid)               │    JSON Inspector    │
│          │                                 │    (400px)           │
│ Container│   ┌────────────────────────┐    │                      │
│ Section  │   │  [Drag here]           │    │  ┌────────────────┐  │
│ Text     │   │                        │    │  │ Discord mock   │  │
│ Button   │   │  Container             │    │  │                │  │
│ Thumb    │   │   ├─ Text Display      │    │  │                │  │
│ Gallery  │   │   ├─ Button            │    │  └────────────────┘  │
│ Separat. │   │   └─ ...               │    │                      │
│          │   └────────────────────────┘    │  ┌────────────────┐  │
│          │                                 │  │ JSON / Errors  │  │
│          │                                 │  └────────────────┘  │
├──────────┴─────────────────────────────────┴──────────────────────┤
│  Status bar: 38/40 components · 2.4/3.0 KB · ✓ Valid              │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2 Tablet (768-1023px)

Palette becomes a left drawer, preview becomes a tab beside the canvas.

### 2.3 Mobile (< 768px)

Tab mode: **Build · Preview · Export**. Palette becomes a bottom sheet.

---

## 3. Design Tokens

### 3.1 Colors (Dark, default)

| Token                   | Hex       | Usage                                |
| ----------------------- | --------- | ------------------------------------ |
| `--bg-base`             | `#1a1b1e` | Main background                      |
| `--bg-surface`          | `#232428` | Panel/card                           |
| `--bg-elevated`         | `#2b2d31` | Popover, dropdown (Discord gray-800) |
| `--bg-input`            | `#1e1f22` | Input field (Discord gray-900)       |
| `--border-subtle`       | `#2e3035` | Divider                              |
| `--border-strong`       | `#3f4147` | Focus ring, selected                 |
| `--text-primary`        | `#f2f3f5` | Primary text                         |
| `--text-secondary`      | `#b5bac1` | Label, hint                          |
| `--text-muted`          | `#949ba4` | Placeholder                          |
| `--brand-blurple`       | `#5865F2` | Primary accent, CTA                  |
| `--brand-blurple-hover` | `#4752c4` | CTA hover                            |
| `--success`             | `#23a55a` | Valid state                          |
| `--warning`             | `#f0b232` | Warning                              |
| `--danger`              | `#f23f43` | Error                                |
| `--spoiler-bg`          | `#202225` | Spoiler blur                         |

### 3.2 Colors (Light, optional)

| Token              | Hex              |
| ------------------ | ---------------- |
| `--bg-base`        | `#ffffff`        |
| `--bg-surface`     | `#f2f3f5`        |
| `--bg-elevated`    | `#e3e5e8`        |
| `--text-primary`   | `#060607`        |
| `--text-secondary` | `#4e5058`        |
| `--brand-blurple`  | `#5865F2` (same) |

### 3.3 Typography

| Role              | Font             | Size | Weight | Line height              |
| ----------------- | ---------------- | ---- | ------ | ------------------------ |
| Display           | `Inter`          | 24px | 700    | 1.2                      |
| Heading           | `Inter`          | 18px | 600    | 1.3                      |
| Body              | `Inter`          | 14px | 400    | 1.5                      |
| Label             | `Inter`          | 12px | 600    | 1.4 (uppercase optional) |
| Code/Mono         | `JetBrains Mono` | 13px | 400    | 1.6                      |
| Preview (Discord) | `gg sans, Inter` | 16px | 400    | 1.375                    |

**Scale:** 12 / 14 / 16 / 18 / 24 / 32.

### 3.4 Spacing

Base unit `4px`. Scale: `4, 8, 12, 16, 24, 32, 48, 64`.

### 3.5 Radius

| Token      | Value  | Usage               |
| ---------- | ------ | ------------------- |
| `--r-sm`   | 4px    | Input, small button |
| `--r-md`   | 8px    | Card, panel         |
| `--r-lg`   | 12px   | Container preview   |
| `--r-full` | 9999px | Pill, emoji chip    |

### 3.6 Shadow

| Token            | Value                            |
| ---------------- | -------------------------------- |
| `--shadow-sm`    | `0 1px 2px rgba(0,0,0,.3)`       |
| `--shadow-md`    | `0 4px 12px rgba(0,0,0,.4)`      |
| `--shadow-focus` | `0 0 0 2px var(--brand-blurple)` |

---

## 4. UI Components

### 4.1 Palette Item

```
┌───────────────────────┐
│  ▦  Container         │   ← icon + label
│     type 17           │   ← subtype (mono, muted)
└───────────────────────┘
```

- Hover: `--bg-elevated` background, `grab` cursor.
- Drag: semi-transparent ghost + blurple border.

### 4.2 Canvas Node

Default:

```
┌────────────────────────────────────────┐
│ ⠿  Text Display             [🗑] [⋯]  │
│ ─────────────────────────────────────  │
│ # Patch Notes                          │
│ - Fixed a bug...                       │
└────────────────────────────────────────┘
```

- 1px `--border-subtle` border.
- Selected: 2px `--brand-blurple` border + focus shadow.
- Hover: `⠿` drag handle appears.
- Drag handle on the left, trash and menu icons on the right.

### 4.3 Nested Drop Zone

While dragging, valid child areas are highlighted with a **dashed blurple outline** + small label (`Drop Section here`). Invalid zones are **not highlighted**.

### 4.4 Inline Editor

Standard field:

```
┌─────────────────────────────┐
│ Label                       │  ← 12px secondary
│ ┌─────────────────────────┐ │
│ │ Input                   │ │  ← 14px, input bg
│ └─────────────────────────┘ │
│ Hint or error               │  ← 12px muted/red
└─────────────────────────────┘
```

- **Text Display**: auto-grow textarea + small toolbar buttons (B, I, S, link, code).
- **Accent color**: color picker + hex input. Real-time conversion to integer.
- **Media URL**: input + live validation (✓ / ✗ icon on the right).

### 4.5 Error Panel

```
┌────────────────────────────────────────┐
│  ⚠  2 errors                           │
├────────────────────────────────────────┤
│  ● MAX_COMPONENTS                      │
│    components[40]                      │
│    A Container can only hold 40...     │
│    → Remove one component              │
├────────────────────────────────────────┤
│  ● BUTTON_STYLE                        │
│    components[2].components[0]         │
│    Button must use style = 5           │
│    → Change style to "link"            │
└────────────────────────────────────────┘
```

- Clicking an error scrolls to and highlights the node on the canvas.
- Severity colors: error `--danger`, warning `--warning`.

### 4.6 Status Bar

```
  38 / 40 components    ·    2.4 / 3.0 KB    ·    ✓ Valid
```

- Counters turn red when over the limit.
- Byte counter: green < 90%, yellow 90-100%, red > 100%.

### 4.7 Preview Panel

Simulated Discord message:

```
┌──────────────────────────────────────┐
│  [Avatar]  Username        Today     │
│            ┌────────────────────────┐│
│            │▎# Patch Notes          ││ ← accent left bar
│            │                        ││
│            │ - Fixed a bug...       ││
│            │                        ││
│            │ [ Open ] [ Store ]     ││
│            └────────────────────────┘│
└──────────────────────────────────────┘
```

- Background `#313338` (Discord dark chat).
- Container: `#2b2d31` bg, 4px accent border-left, 8px radius.
- Markdown: follows Discord styling (bold, italic, code blocks, spoiler).

---

## 5. Interaction and Motion

| Action        | Animation               | Duration | Easing      |
| ------------- | ----------------------- | -------- | ----------- |
| Drag start    | scale 1 → 1.02 + shadow | 120ms    | ease-out    |
| Drop          | blurple border flash    | 200ms    | ease-out    |
| Node add      | fade + 8px slide-in     | 180ms    | ease-out    |
| Node delete   | fade + collapse         | 150ms    | ease-in     |
| Error appears | subtle shake (2px)      | 200ms    | ease-in-out |
| Panel switch  | cross-fade              | 150ms    | linear      |

**Reduced motion:** all animations are disabled when `prefers-reduced-motion: reduce`.

---

## 6. Iconography

Use **Lucide** (1.5 stroke, 16/20 size). Map:

| Component     | Icon                |
| ------------- | ------------------- |
| Container     | `Square` or `Box`   |
| Section       | `Columns2`          |
| Text Display  | `Type`              |
| Button        | `MousePointerClick` |
| Thumbnail     | `Image`             |
| Media Gallery | `Images`            |
| Separator     | `Minus`             |
| Action Row    | `Rows`              |
| Drag handle   | `GripVertical`      |
| Delete        | `Trash2`            |
| Copy          | `Copy`              |
| Check         | `Check`             |
| Warning       | `AlertTriangle`     |
| Error         | `CircleAlert`       |

---

## 7. Accessibility

- **Contrast:** all text ≥ 4.5:1 (AA). Blurple `#5865F2` on `#1a1b1e` = 4.7:1 ✓.
- **Focus ring:** always visible, 2px blurple + 2px offset.
- **Keyboard:**
  - `Tab` / `Shift+Tab` navigate
  - `Enter` edits the node
  - `Esc` exits editing
  - `Delete` removes the selected node
  - `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` redo
  - `Ctrl/Cmd+C/V` copy/paste node
- **ARIA:**
  - Canvas = `role="tree"`, nodes = `role="treeitem"` with `aria-level`.
  - Drop zone = `aria-dropeffect="move"`.
  - Live region for errors and counters.
- **Screen reader:** every validation change is announced via `aria-live="polite"`.

---

## 8. Empty and Loading States

### 8.1 Empty Canvas

```
        ┌────────────────────────┐
        │      ╭────────╮        │
        │      │   ▦    │        │
        │      ╰────────╯        │
        │                        │
        │  Start by              │
        │  dragging a Container  │
        │  here                  │
        │                        │
        │  [ Use a template ]    │
        └────────────────────────┘
```

### 8.2 Monaco Loading

Gray skeleton with a subtle shimmer. No spinner.

---

## 9. Microcopy

| Context       | Copy                                                          |
| ------------- | ------------------------------------------------------------- |
| Empty canvas  | "Start by dragging a Container here"                          |
| Valid         | "✓ Payload valid, ready to paste"                             |
| Error counter | "2 errors to fix"                                             |
| Byte over     | "142 bytes over, trim the content"                            |
| Export inline | "Paste inside your page's `<head>`"                           |
| Export linked | "Upload the JSON to your server, then paste this `<link>`"    |
| Cache warning | "Discord caches previews ~30 minutes. Add `?v=2` to refresh." |

Tone: **concise, supportive, never blaming.**

---

## 10. Ready-Made Templates (for MVP empty state)

1. **Patch Notes** - Container + Text Display + Separator + Action Row (2 buttons).
2. **Game Release** - Section (headline + button) + Media Gallery (3 imgs) + caption + Separator + Action Row.
3. **Announcement** - Container + Text Display (heading) + Separator + Text Display (body) + Button.
4. **Spoiler Reveal** - Section with spoiler Thumbnail.

These appear in the "Use template" dialog when the canvas is empty.

---

## 11. Asset Export

- **Favicon:** blurple square with a `▦` glyph.
- **OG image (for the EmbedLint page itself):** follows rule §20 of the reference document (og:title, og:description, og:image, twitter:card).

---

## 12. Cross-References

- Data and component structure → `ARCHITECTURE.md §5`
- Visual validation rules → `PRD.md §5.3`
- Implementation conventions → `AGENTS.md`
