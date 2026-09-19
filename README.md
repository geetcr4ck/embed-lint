# EmbedLint

> **Visual builder & linter for Discord Component Embeds.**  
> Drag, drop, validate, export — catch invalid payloads before Discord does.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)

---

## What is EmbedLint?

**EmbedLint** is a visual tool for building, validating, and exporting **Discord Component Embeds** (payload `type 17` Container). Built for vibecoders, bot developers, and Discord communities who want their link previews to look clean and rich without having to write JSON manually.

Key features:

- **Drag & drop builder** — compose Container, Section, Text Display, Button, Thumbnail, Media Gallery, Separator.
- **Real-time validation** — check Discord limits live as you type: max 40 components, 3,000 bytes linked JSON, buttons only `style: 5`, media only `{ url }`, URLs max 2,048 characters.
- **Discord-accurate preview** — simulate how the embed will look on Discord.
- **Two export modes** — inline `<script id="discord:component-embed">` or linked JSON via `<link rel="discord:component-embed">`.
- **OG fallback generator** — Open Graph meta tags that must be present alongside component embed.

---

## How It Works Briefly

1. **Build** — drag components onto the canvas, fill in content, set accent color.
2. **Validate** — EmbedLint automatically checks every Discord constraint.
3. **Preview** — see the result as it will appear on Discord.
4. **Export** — copy inline script or linked JSON, paste it into your web page.
5. **Fallback** — copy OG meta tags for standard preview if component embed fails.

---

## Installation (Development)

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm / pnpm / bun
- Cloudflare account (for deployment)

### Local Setup

```bash
# Clone repo
git clone https://github.com/geetcr4ck/embed-lint.git
cd embed-lint

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Cloudflare Pages

```bash
# Build Next.js + transform for Cloudflare
npm run build:pages

# Preview the build locally
npm run pages:dev
```

---

## Deploy to Cloudflare Pages

1. Push the repo to GitHub.
2. Open **Cloudflare Dashboard → Workers & Pages → Pages → Create a project**.
3. Connect to the `geetcr4ck/embed-lint` repo.
4. Configure the build:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build:pages` |
| Build output directory | `dist` |
| Root directory | `/` |

5. Add environment variables:
   - `NODE_VERSION` = `20`
   - `HUSKY` = `0` (if using Husky)
6. Under **Settings → Functions → Runtime → Compatibility flags**, add `nodejs_compat` for Production and Preview.
7. Deploy.

After deployment, the site will be available at `https://embed-lint.pages.dev`.

---

## Project Structure

```
embed-lint/
├── app/                  # Next.js App Router
├── components/           # UI components (builder, preview, validator)
├── lib/                  # Validator, parser, exporter
├── public/               # Static assets
├── next.config.js        # Next.js + Cloudflare configuration
├── tailwind.config.ts    # Tailwind configuration (v4 CSS-first)
├── postcss.config.js
├── tsconfig.json
└── package.json
```

Full details are in the **Repo Structure** section below.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:
- You are free to use, modify, and distribute this project.
- If you run a modified version as a public service (SaaS), you **must** open-source it.
- See the [LICENSE](./LICENSE) file for the full text.

---

## Contributing

Contributions are welcome! Feel free to open an issue or pull request.

1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/new-validator`).
3. Commit your changes.
4. Push and open a PR.

---

Built with ☕ and a little blurple.
