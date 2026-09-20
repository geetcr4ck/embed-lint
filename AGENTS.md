# EmbedLint - AGENTS.md

> Guide for AI coding agents (Claude Code, Cursor, Copilot, Aider, etc.) contributing to this repo.

---

## 0. TL;DR for Agents

- **Read first** `PRD.md` (what is built), `ARCHITECTURE.md` (how), `DESIGN.md` (look).
- **Stack:** Next.js 14 App Router + TypeScript strict + Tailwind + Zustand + Zod.
- **Principle:** client-side only, no backend, no fetching user URLs, all validation in the browser.
- **Do not** add dependencies without a strong reason (see §7).
- **Always** run `npm run lint && npm run typecheck && npm run test` before declaring done.
- **Commits** follow Conventional Commits with scope (see §10).

---

## 1. Local Setup

```bash
git clone <repo>
cd embedlint
npm install
npm run dev          # http://localhost:3000
```

Node ≥ 20. Use `npm` (not pnpm/yarn) for lockfile consistency.

Scripts:

| Script      | Purpose                 |
| ----------- | ----------------------- |
| `dev`       | Dev server              |
| `build`     | Static export to `out/` |
| `preview`   | Serve build output      |
| `lint`      | ESLint                  |
| `typecheck` | `tsc --noEmit`          |
| `test`      | Vitest unit             |
| `test:e2e`  | Playwright              |
| `format`    | Prettier                |

---

## 2. Code Structure - Golden Rules

1. **One component = one file.** Filename = component name (PascalCase).
2. **All types live in `lib/schema/`.** Never define Discord payload types outside that folder.
3. **Pure validator.** `lib/validator/*` must not import React or touch the DOM.
4. **Pure serializer.** Same for `lib/serializer/*`.
5. **No `any`.** When you need an escape hatch, use `unknown` + Zod parse.
6. **No side effects in render.** All mutations go through store actions.
7. **Granular Zustand selectors.** Never `useStore(s => s)`, always pick fields.

---

## 3. TypeScript Conventions

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- Prefer `type` for unions, `interface` for extendable objects.
- Discriminated unions on `type` for component nodes.
- Use `satisfies` for registry configs.
- **No** `as` casts except narrowing `JSON.parse` results, straight into Zod parse.

Registry pattern example (single edit point for adding components):

```ts
export const COMPONENT_REGISTRY = {
  10: {
    schema: TextDisplaySchema,
    editor: TextDisplayEditor,
    preview: TextDisplayPreview,
    label: "Text Display",
    icon: Type,
    allowedParents: [17, 9],
    allowedChildren: [],
  },
  // ...
} satisfies Record<ComponentType, ComponentMeta>;
```

---

## 4. React Conventions

- **Server Components by default**, `'use client'` only for interactive parts.
- Because of static export, all pages are effectively client-side, still mark them honestly.
- Custom hooks live in `hooks/`, `use` prefix.
- Avoid `useEffect` for state sync; use the store.
- `useEffect` only for: localStorage, global listeners, Monaco setup.
- Preview renders from the **tree**, not JSON.

---

## 5. Tailwind Conventions

- Use tokens via CSS variables (`--bg-base`, etc.), never hardcode hex.
- Utility-first. Extract to a component past 15 classes.
- `cn()` helper (clsx + tailwind-merge) for conditional classes.
- Dark mode by default; light mode via `[data-theme="light"]`.
- No inline `style` except dynamic values (accent color, media sizes).

---

## 6. Validator - Special Rules

Every new rule **must**:

1. Have a unique code (SCREAMING_SNAKE).
2. Have test cases in `test/validator/`, at least 1 valid, 1 invalid.
3. Reference a section in `LINK PREVIEW + Component EMBED DISCORD.md` in a comment.
4. Return `ValidationIssue` with `path` (JSON pointer), `message`, `hint`.

Example:

```ts
// Ref: §17, Button allows only style 5 + key whitelist
export const buttonShapeRule: Rule = (payload) => {
  const issues: ValidationIssue[] = [];
  walkButtons(payload, (btn, path) => {
    const allowed = new Set([
      "type",
      "url",
      "style",
      "label",
      "emoji",
      "disabled",
    ]);
    for (const k of Object.keys(btn)) {
      if (!allowed.has(k)) {
        issues.push({
          severity: "error",
          path: [...path, k],
          code: "BUTTON_KEYS",
          message: `Key "${k}" is not allowed on Button.`,
          hint: "Remove this key; only url, style, label, emoji, disabled are valid.",
        });
      }
    }
  });
  return issues;
};
```

**Byte limit:** always use `byteSize()` (TextEncoder), not `str.length`.

---

## 7. Dependency Policy

Allowed (already present): React, Next, Tailwind, Zustand, Zod, dnd-kit, Monaco, markdown-it, DOMPurify, lucide-react, react-hook-form.

**Needs approval** before adding: large UI kits (MUI, Chakra), other state libraries (Redux, Jotai), heavy animation libs (Framer Motion only for 1-2 spots).

**Forbidden:** backend SDKs (Supabase, Firebase), third-party analytics, any tracking script.

---

## 8. Testing

- Every validator rule → test.
- Every util (`hex`, `byteSize`, `detectFormat`) → test.
- Serializer round-trip (`fromJson(toJson(x)) === x`).
- Minimum E2E:
  1. Open → drag Container → add Text Display → copy inline → assert string.
  2. Import JSON → export linked → assert bytes.
  3. Add 41 components → assert `MAX_COMPONENTS` error.

Coverage target: ≥ 90% for `lib/`.

---

## 9. Performance Guardrails

- Do not re-render the whole canvas when editing text in one node, use granular selectors + `memo`.
- Run the validator **debounced 200ms**, not per keystroke.
- Lazy `dynamic import` for Monaco, keep it out of the main bundle.
- Preview uses `useMemo` depending only on relevant nodes.

---

## 10. Git and Commit

Format: Conventional Commits.

```
feat(validator): add MEDIA_FORMAT rule
fix(serializer): strip undefined on button export
docs(agents): clarify byte limit
refactor(canvas): extract DropZone
test(validator): cover BUTTON_KEYS
chore(deps): bump zod to 3.23
```

Scopes used: `validator`, `serializer`, `canvas`, `palette`, `preview`, `export`, `schema`, `store`, `ui`, `docs`, `deps`.

Branch: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.

PRs must: green CI, tests included, docs updated when behavior changes.

---

## 11. What NOT To Do

- ❌ Adding a backend / API routes / database.
- ❌ Fetching user-entered URLs (SSRF, privacy).
- ❌ Storing data on a server.
- ❌ Using `eval`, `new Function`, `dangerouslySetInnerHTML` without DOMPurify.
- ❌ Changing the Discord payload schema without updating `lib/schema/` + tests + § reference.
- ❌ Committing `.env`, `node_modules`, `.next`, `out`.
- ❌ Ignoring TypeScript errors with `@ts-ignore` (use `@ts-expect-error` + reason comment when truly needed).

---

## 12. Checklist Before "Done"

- [ ] `npm run lint` clean.
- [ ] `npm run typecheck` clean.
- [ ] `npm run test` green.
- [ ] New tests added when changing `lib/validator` or `lib/serializer`.
- [ ] No `console.log` left.
- [ ] UI matches `DESIGN.md` (color tokens, spacing, icons).
- [ ] Accessibility: keyboard operable.
- [ ] Validator rules reference Discord doc sections.
- [ ] `README.md` / docs updated when needed.

---

## 13. Quick Reference

| Need                         | See                                         |
| ---------------------------- | ------------------------------------------- |
| Product rules                | `PRD.md`                                    |
| Code and data structure      | `ARCHITECTURE.md`                           |
| Color tokens, spacing, icons | `DESIGN.md`                                 |
| Original Discord rules       | `LINK PREVIEW + Component EMBED DISCORD.md` |

**Rule #1:** when torn between "add a feature" and "protect scope", **protect scope**. This tool is small, fast, and focused.
