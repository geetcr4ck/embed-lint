# EmbedLint

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)

Builder and validator for **Discord Component Embeds** (Container `type 17`). Fully client-side, static export to Cloudflare Pages. See `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `AGENTS.md`.

Status: **MVP complete.** Drag-and-drop builder, real-time validation, Discord preview, inline/linked export, JSON inspector, import, templates, autosave, undo/redo.

## Features

- 8-type palette (Container, Action Row, link Button, Section, Text Display, Thumbnail, Media Gallery, Separator) with drag and drop plus click/keyboard fallback.
- Per-type inline editors (accent picker, markdown toolbar, live URL validation).
- 12-rule validator (max 40 components, 3000 bytes, Button/Media whitelists, Section structure, integer accent) with paths and fix suggestions. Clicking an error selects and scrolls to the node.
- Discord preview (dark/light via tokens) with spoiler reveal, rendered from the tree.
- Inline `<script>` and linked `<link>` export plus JSON download, over-limit protection, `?v=2` cache hint.
- Lazy Monaco JSON inspector, two-step confirm paste/upload import, 4 templates, status bar counters.
- Responsive: Build/Preview/Export tabs on mobile, palette drawer on tablet, 3 columns on desktop.

## Setup

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to out/
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run test         # vitest run (121 tests)
```

Node 20 or later, use plain `npm`.

## Deploy (Cloudflare Pages)

- Build command: `npm run build`, output directory: `out`, Node 20.
- Headers and routing already set up in `public/_headers` and `public/_redirects`.

## Dependencies Considered but Not Used

| Package                   | Decision                                                            |
| ------------------------- | ------------------------------------------------------------------- |
| `react-hook-form`         | Not used, controlled inputs are enough for editors.                 |
| `@tailwindcss/typography` | Not used, markdown styles hand-written to follow theme tokens.      |
| `@testing-library/*`      | Not used yet, Vitest units cover `lib` plus build as integration.   |
| `playwright`              | Golden-path E2E not automated yet, click verification still manual. |

## Code Rules

- No `any` (only `unknown` plus Zod parse), no backend, no fetching user URLs.
- Pure validator and serializer: no React, no DOM.
- Discord payload types only in `lib/schema/`, canonical builder types in `lib/serializer/types.ts`.

## License

Licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See [LICENSE](./LICENSE). If you run a modified version as a public service, you must open-source it.
