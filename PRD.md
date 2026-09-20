# EmbedLint - Product Requirements Document

> **Version:** 1.0.0
> **Status:** Draft → Ready for Build
> **Owner:** EmbedLint Team
> **Primary Reference:** `LINK PREVIEW + Component EMBED DISCORD.md`

---

## 1. Product Summary

**EmbedLint** is a client-side web app for building, validating, and exporting **Discord Component Embeds** (Container `type 17`) without writing JSON by hand.

Target users: developers, bot authors, and webmasters who want their link previews to render as _component embeds_ in Discord, not just standard Open Graph.

**Value proposition:**

- Drag and drop → valid JSON, no need to memorize the Discord schema.
- Real-time validation → know the 40-component, 3,000-byte, 2,048-char URL limits before deploying.
- Visual preview → simulates Discord rendering before sharing.
- Paste-ready export → inline `<script>` or linked `<link>` JSON.

---

## 2. Background and Problem

Based on the reference document:

1. Component embeds require **strict JSON** (root Container `type 17`, only component types `1, 2, 9, 10, 11, 12, 14, 17`, max 40 components).
2. Many pitfalls make the **entire payload invalid** (e.g. `custom_id` on Button, `style ≠ 5`).
3. There is a **3,000-byte** limit for linked JSON measured in raw bytes, easy to exceed without noticing.
4. Common causes of "preview not showing": WAF blocking `Discordbot`, tags not server-rendered, 30-minute cache, and similar.
5. Developers waste time debugging blind because no preview tool exists.

**Opportunity:** few interactive tools specifically target this new format. EmbedLint fills that gap.

---

## 3. Goals and Non-Goals

### 3.1 Goals

- G1: Non-expert users can create a valid payload in < 5 minutes.
- G2: Validation 100% aligned with the rules in the reference document (byte limits, type whitelist, etc.).
- G3: Visual preview closely matches Discord rendering.
- G4: Export with no manual editing.
- G5: Fully client-side, free, no login.

### 3.2 Non-Goals (v1)

- Not a Discord bot builder.
- Does not send/post embeds to Discord (read-only builder).
- Does not store projects in the cloud (v1 has no accounts).
- Does not cover interactive components (Select Menu, Modal, etc.), only the read-only subset.
- Does not scrape third-party URLs (v1 manual input).

---

## 4. User Personas

| Persona                 | Need                                   | Pain Point                              |
| ----------------------- | -------------------------------------- | --------------------------------------- |
| **Bot Dev** (Rian)      | Fast JSON export for their bot         | Schema easy to get wrong, often invalid |
| **Webmaster** (Sari)    | Paste component embeds into blog pages | Unaware of byte limits, WAF blocks      |
| **Indie Hacker** (Budi) | Cool link previews for products        | Previews hard to debug, 30-minute cache |

---

## 5. Key Features (MVP)

### 5.1 Canvas and Palette

- **Palette** contains the supported components:
  - Container (`17`) - root
  - Action Row (`1`)
  - Button (`2`, link style only)
  - Section (`9`)
  - Text Display (`10`)
  - Thumbnail (`11`)
  - Media Gallery (`12`)
  - Separator (`14`)
- **Drag and drop** from palette to canvas.
- **Nested drop zones** following Discord rules (Container → Section → Text Display, etc.).
- Reorder via drag, delete via button/`Delete` key.

### 5.2 Inline Editor

- **Text Display**: markdown editing (headings, bold, italic, strikethrough, spoiler, list, link, code).
- **Container**: set `accent_color` (hex → integer), `spoiler` boolean.
- **Button**: `url`, `label` (optional), `emoji` (optional), `disabled`. Style locked to `5`.
- **Thumbnail / Media Gallery items**: `url` input, `description` (gallery items only).
- **Section**: pair Text Display + accessory (Thumbnail or Button).

### 5.3 Real-Time Validation

Rules checked while typing:

| Rule             | Detail                                                             | Source       |
| ---------------- | ------------------------------------------------------------------ | ------------ |
| Max components   | Total ≤ 40                                                         | §17          |
| Max linked bytes | Raw JSON ≤ 3,000 bytes                                             | §15 Option 2 |
| Button whitelist | Only `type, url, style, label, emoji, disabled`; `style = 5`       | §17          |
| Media whitelist  | Only `{ url }`; URL ≤ 2,048 chars                                  | §18          |
| Media format     | PNG, GIF, JPEG, WebP, AVIF (Thumbnail); + MP4, MOV, WebM (Gallery) | §18          |
| Root structure   | Single Container `type 17` at root                                 | §16          |
| Component type   | Only `1, 2, 9, 10, 11, 12, 14, 17`                                 | §17          |

Errors are shown with a **location** (JSON path) + **fix suggestion**.

### 5.4 Real-Time Preview

- The preview panel simulates the Discord look (dark theme + light option).
- Shows: container accent color, markdown rendering, thumbnail, media gallery, separator spacing, button links.
- Spoilers render blurred, click to reveal.

### 5.5 Export

Two modes:

**A. Inline**

```html
<script id="discord:component-embed" type="application/json">
  { ... }
</script>
```

**B. Linked**

```html
<link
  rel="discord:component-embed"
  type="application/json"
  href="https://situs.com/embed.json"
/>
```

Plus **Copy** and **Download** buttons (for linked `.json`).

### 5.6 JSON Inspector (MVP bonus)

- A "JSON" tab shows the live payload (read-only) with syntax highlighting.
- **Copy JSON** button.

---

## 6. User Stories

| ID    | As a      | I want                             | So that                      |
| ----- | --------- | ---------------------------------- | ---------------------------- |
| US-01 | Dev       | drag Container onto the canvas     | I can start a payload        |
| US-02 | Dev       | add Text Display + markdown        | I can write patch notes      |
| US-03 | Dev       | add a link Button                  | I can point to a page        |
| US-04 | Dev       | see a "38 / 40 components" counter | I know the limit             |
| US-05 | Webmaster | see a live byte counter            | I stay under 3,000           |
| US-06 | Webmaster | copy the `<link>` tag              | I can paste it into `<head>` |
| US-07 | Budi      | see the dark/light preview         | I can check the appearance   |
| US-08 | Everyone  | click "Copy JSON"                  | I can use it on the server   |
| US-09 | Everyone  | see errors with paths              | I can fix them fast          |

---

## 7. Functional Requirements (Summary)

| Code  | Requirement                               |
| ----- | ----------------------------------------- |
| FR-01 | Drag and drop components from the palette |
| FR-02 | Inline editing for all fields             |
| FR-03 | Automatic validation (delay ≤ 300ms)      |
| FR-04 | Preview updates ≤ 100ms after edit        |
| FR-05 | Live byte counter for linked JSON         |
| FR-06 | Component counter (n/40)                  |
| FR-07 | Inline and linked export                  |
| FR-08 | Copy and download JSON                    |
| FR-09 | Error panel with path + suggestions       |
| FR-10 | Undo/Redo (min. 20 steps)                 |
| FR-11 | Auto-save to localStorage                 |
| FR-12 | Import JSON (paste/upload) for editing    |

---

## 8. Non-Functional Requirements

| Aspect            | Target                                           |
| ----------------- | ------------------------------------------------ |
| **Performance**   | FCP < 1.5s, TTI < 2.5s on a mid-tier laptop      |
| **Bundle size**   | First load JS < 250 KB gzip                      |
| **Browser**       | Chrome, Edge, Firefox, Safari (last 2 versions)  |
| **UI language**   | Indonesian (default), English (optional)         |
| **Accessibility** | WCAG 2.1 AA, keyboard navigable                  |
| **Offline**       | Fully functional after first load (PWA optional) |
| **Cost**          | Rp 0 (Cloudflare Pages free tier)                |

---

## 9. Success Metrics

| Metric                                            | 3-month target |
| ------------------------------------------------- | -------------- |
| Valid payload with no errors in the first session | ≥ 70%          |
| Median time from open → copy export               | < 4 minutes    |
| Weekly retention (returning users)                | ≥ 25%          |
| Validator bug reports (false positives/negatives) | < 5            |

---

## 10. Scope and Roadmap

### MVP (v1.0)

Full 8-type palette, inline editor, validator, preview, inline + linked export, JSON inspector, localStorage.

### v1.1

Import from URL (fetch OG + component-embed, preview existing), template library, share via URL hash (compress JSON), offline PWA.

### v1.2

OG fallback builder (og:title, og:description, og:image), interactive WAF checklist, multi-language.

### v2.0

Optional accounts + cloud sync, GitHub repo integration (publish JSON to raw URL), Discord test post via webhook (opt-in).

---

## 11. Risks and Mitigations

| Risk                                       | Impact                  | Mitigation                                              |
| ------------------------------------------ | ----------------------- | ------------------------------------------------------- |
| Discord changes the schema                 | Validator becomes wrong | Zod-based validator + version in comments; fast updates |
| Byte limit differs when served             | Payload gets truncated  | Show raw size + 5% buffer warning                       |
| Media format undetectable without fetching | Broken preview          | Preview uses the URL as-is; warn on odd extensions      |
| Users confused by nested structure         | Frustration             | Guided mode: ready-made templates                       |

---

## 12. Acceptance Criteria (Definition of Done)

- [ ] All FR-01..FR-12 work.
- [ ] Validator passes 30+ test cases from the reference document.
- [ ] Inline and linked export produce valid HTML/JSON that can be pasted without editing.
- [ ] Preview reflects accent color, markdown, media, separator, spoiler.
- [ ] Successful deploy on Cloudflare Pages (production URL live).
- [ ] Lighthouse Performance ≥ 90, Accessibility ≥ 95.

---

## 13. References

- `LINK PREVIEW + Component EMBED DISCORD.md` (primary document)
- Discord Components Reference
- Discord Embed Debugger: https://discord.com/developers/embeds
