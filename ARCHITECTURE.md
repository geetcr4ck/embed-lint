# EmbedLint - Architecture Document

> **Version:** 1.0.0
> **Paradigm:** Full client-side, static site
> **Hosting:** Cloudflare Pages (free tier)

---

## 1. Architecture Principles

1. **Zero backend.** All logic runs in the browser. No server, no database.
2. **Static-first.** Builds produce static assets served from the Cloudflare CDN.
3. **Type-safe end-to-end.** Strict TypeScript + Zod as the single schema source of truth.
4. **Deterministic validation.** Pure validator (pure function), JSON in, error list out.
5. **Composable UI.** Each embed component has its own renderer and editor.

---

## 2. Tech Stack

| Layer           | Choice                                                            | Reason                                        |
| --------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| Framework       | **Next.js 14 (App Router)** with `output: 'export'`               | Static export, good DX, fits Cloudflare Pages |
| Language        | **TypeScript** (strict)                                           | Type safety                                   |
| Styling         | **Tailwind CSS** + `@tailwindcss/typography`                      | Fast, consistent                              |
| State           | **Zustand** + `immer`                                             | Lightweight, easy for tree state              |
| DnD             | **@dnd-kit/core** + `@dnd-kit/sortable`                           | Accessible, modern                            |
| Form/Edit       | **react-hook-form** (for complex fields) + inline contentEditable | Lightweight                                   |
| Validation      | **Zod**                                                           | Schema + error path                           |
| JSON editor     | **Monaco Editor** (`@monaco-editor/react`)                        | Syntax highlight + error markers              |
| Markdown render | **markdown-it** + Discord-ish plugin                              | Preview Text Display                          |
| Icons           | **lucide-react**                                                  | Consistent                                    |
| Testing         | **Vitest** + **@testing-library/react** + **Playwright**          | Unit + e2e                                    |
| Linter          | **ESLint** + **Prettier** + **Biome** (optional)                  | Code quality                                  |

---

## 3. Architecture Diagram (High Level)

```
┌────────────────────────────────────────────────────────────┐
│                      Browser (Client)                      │
│                                                            │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐   │
│  │   Palette    │   │   Canvas     │   │   Preview     │   │
│  │  (DnD src)   │──▶│  (Tree UI)   │──▶│  (Discord     │   │
│  └──────────────┘   └──────┬───────┘   │   Simulator)  │   │
│                            │           └───────────────┘   │
│                            ▼                               │
│                   ┌──────────────────┐                     │
│                   │  Zustand Store   │                     │
│                   │  (Document Tree) │                     │
│                   └────────┬─────────┘                     │
│                            │                               │
│              ┌─────────────┼─────────────┐                 │
│              ▼             ▼             ▼                │
│      ┌─────────────┐ ┌───────────┐ ┌─────────────┐         │
│      │ Serializer  │ │ Validator │ │  Exporters  │         │
│      │ (→ JSON)    │ │  (Zod)    │ │ (inline/    │         │
│      └──────┬──────┘ └─────┬─────┘ │  linked)    │         │
│             │              │       └──────┬──────┘         │
│             ▼              ▼              ▼                │
│      ┌──────────────────────────────────────────┐          │
│      │  JSON Inspector (Monaco) + Error Panel   │          │
│      └──────────────────────────────────────────┘          │
│                                                            │
│      ┌──────────────────────────────────────────┐          │
│      │  localStorage (auto-save) + URL hash     │          │
│      └──────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────┘
                             │
                             ▼  (static assets)
                  ┌──────────────────────┐
                  │  Cloudflare Pages    │
                  │  (CDN, free tier)    │
                  └──────────────────────┘
```

---

## 4. Folder Structure

```
embedlint/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # Main builder
│   ├── globals.css
│   └── (marketing)/
│       └── about/page.tsx
├── components/
│   ├── builder/
│   │   ├── Palette.tsx
│   │   ├── Canvas.tsx
│   │   ├── NodeRenderer.tsx
│   │   ├── DropZone.tsx
│   │   └── editors/
│   │       ├── ContainerEditor.tsx
│   │       ├── SectionEditor.tsx
│   │       ├── TextDisplayEditor.tsx
│   │       ├── ButtonEditor.tsx
│   │       ├── ThumbnailEditor.tsx
│   │       ├── MediaGalleryEditor.tsx
│   │       └── SeparatorEditor.tsx
│   ├── preview/
│   │   ├── DiscordPreview.tsx
│   │   └── renderers/           # per component type
│   ├── inspector/
│   │   ├── JsonInspector.tsx
│   │   └── ErrorPanel.tsx
│   ├── export/
│   │   ├── ExportPanel.tsx
│   │   └── snippets.ts
│   └── ui/                      # primitives (Button, Input, etc.)
├── lib/
│   ├── schema/
│   │   ├── component.ts         # Zod schema per type
│   │   ├── payload.ts           # Root payload schema
│   │   └── constants.ts         # Limits (40, 3000, 2048, ...)
│   ├── validator/
│   │   ├── index.ts             # validate(tree) → errors[]
│   │   ├── rules/               # one rule per constraint
│   │   └── byteSize.ts          # UTF-8 byte counter
│   ├── serializer/
│   │   ├── toJson.ts            # Tree to Discord payload
│   │   └── fromJson.ts          # payload to Tree
│   ├── store/
│   │   ├── document.ts          # main Zustand store
│   │   └── selectors.ts
│   ├── exporters/
│   │   ├── inline.ts
│   │   └── linked.ts
│   ├── media/
│   │   └── detectFormat.ts      # from extension / data URL
│   └── utils/
│       ├── id.ts
│       └── hex.ts               # hex ↔ integer accent color
├── hooks/
│   ├── useAutoSave.ts
│   ├── useUndoRedo.ts
│   └── useDebounce.ts
├── test/
│   ├── validator/
│   ├── serializer/
│   └── e2e/
├── public/
│   └── favicon, og image
├── next.config.mjs              # output: 'export'
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. Data Model

### 5.1 Document Tree (internal state)

The editor does not store raw JSON; it stores a UI-rich **tree of nodes**, then serializes them into the Discord payload.

```ts
type NodeId = string;

interface BaseNode {
  id: NodeId; // internal, not part of the export
  type: ComponentType; // 1 | 2 | 9 | 10 | 11 | 12 | 14 | 17
  children?: NodeId[]; // for container/section/action-row
  parentId?: NodeId;
}

interface ContainerNode extends BaseNode {
  type: 17;
  accentColor?: number; // integer
  spoiler?: boolean;
}

interface SectionNode extends BaseNode {
  type: 9;
  // children: [TextDisplay, accessory?]
  accessoryId?: NodeId;
}

interface TextDisplayNode extends BaseNode {
  type: 10;
  content: string; // markdown
}

interface ButtonNode extends BaseNode {
  type: 2;
  style: 5; // locked
  url: string;
  label?: string;
  emoji?: { name: string; id?: string };
  disabled?: boolean;
}

interface ThumbnailNode extends BaseNode {
  type: 11;
  url: string;
  description?: string;
  spoiler?: boolean;
}

interface MediaGalleryNode extends BaseNode {
  type: 12;
  items: { url: string; description?: string; spoiler?: boolean }[];
}

interface SeparatorNode extends BaseNode {
  type: 14;
  spacing?: 1 | 2;
  divider?: boolean;
}

interface ActionRowNode extends BaseNode {
  type: 1;
  // children: Button[]
}

type BuilderNode =
  | ContainerNode
  | SectionNode
  | TextDisplayNode
  | ButtonNode
  | ThumbnailNode
  | MediaGalleryNode
  | SeparatorNode
  | ActionRowNode;

interface DocumentState {
  nodes: Record<NodeId, BuilderNode>;
  rootId: NodeId | null;
  selectedId: NodeId | null;
  past: Snapshot[];
  future: Snapshot[];
  meta: { version: 1 };
}
```

### 5.2 Discord Payload (output)

```ts
interface DiscordPayload {
  component: DiscordContainer;
}

interface DiscordContainer {
  type: 17;
  accent_color?: number;
  spoiler?: boolean;
  components: DiscordComponent[];
}
// etc. per §16-§18
```

---

## 6. Data Flow

```
User Action (drag/edit)
        │
        ▼
Zustand store action  ──▶  immer patch
        │
        ├──▶  useUndoRedo (snapshot)
        ├──▶  useAutoSave (localStorage debounce 500ms)
        │
        ▼
Serializer.toJson(nodes, rootId)
        │
        ├──▶  Validator.validate(payload)
        │         │
        │         ├──▶  ErrorPanel (list + path)
        │         └──▶  Monaco markers
        │
        ├──▶  DiscordPreview (renders straight from the tree, not JSON)
        │
        └──▶  Exporters
                 ├── inline (string)
                 └── linked (string + JSON file)
```

**Important note:** Preview renders from the **tree**, not the serialized JSON, for instant feedback independent of full validity. The JSON inspector and export still use the serialize output.

---

## 7. Validator Pipeline

### 7.1 Principles

- Pure function: `validate(doc: DiscordPayload): ValidationResult`.
- Zod schema as **shape check** (data types, enums).
- Custom rules as **semantic check** (byte size, count, format).

### 7.2 Rule Structure

```ts
type Severity = "error" | "warning";
interface ValidationIssue {
  severity: Severity;
  path: (string | number)[]; // JSON pointer
  code: string; // e.g. 'MAX_COMPONENTS'
  message: string; // human-readable
  hint?: string; // fix suggestion
}
interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  stats: {
    componentCount: number;
    rawBytes: number;
    totalMediaUrls: number;
  };
}
```

### 7.3 Rule Table

| Code                          | Check                                                       | Source |
| ----------------------------- | ----------------------------------------------------------- | ------ |
| `ROOT_SHAPE`                  | Root `{ component: { type: 17 } }`                          | §16    |
| `MAX_COMPONENTS`              | `≤ 40` total                                                | §17    |
| `MAX_BYTES`                   | `JSON.stringify(payload)` ≤ 3000 bytes                      | §15    |
| `BUTTON_KEYS`                 | Only `type,url,style,label,emoji,disabled`                  | §17    |
| `BUTTON_STYLE`                | `style === 5`                                               | §17    |
| `BUTTON_NEEDS_LABEL_OR_EMOJI` | Label or emoji present                                      | §17    |
| `MEDIA_SHAPE`                 | Only `{ url }` (+ optional description/spoiler for gallery) | §18    |
| `MEDIA_URL_LENGTH`            | ≤ 2048 chars                                                | §18    |
| `MEDIA_FORMAT`                | Extension matches whitelist                                 | §18    |
| `CONTAINER_CHILD_TYPE`        | Container children ∈ whitelist                              | §17    |
| `SECTION_SHAPE`               | 1–3 Text Displays + 1 accessory                             | §17    |
| `ACCENT_COLOR`                | Integer 0..16777215                                         | §15/§9 |

### 7.4 Byte Counter

Uses `new TextEncoder().encode(str).length`, **not** string `.length`, because the 3,000-byte limit is measured in raw bytes.

```ts
export const byteSize = (s: string) => new TextEncoder().encode(s).length;
```

---

## 8. Serializer

### 8.1 `toJson(tree)`

Walk the tree from `rootId`, converting to Discord form:

- Drop internal fields (`id`, `parentId`, `children`).
- `accentColor` stored directly as an integer.
- Media item → `{ media: { url }, description?, spoiler? }`.
- Button → `{ type: 2, style: 5, url, label?, emoji?, disabled? }` (drop `undefined`).

### 8.2 `fromJson(payload)`

The reverse, used for the **Import JSON** feature. Each node gets a new `id` via `nanoid`.

---

## 9. Exporters

### 9.1 Inline

```ts
export function toInlineSnippet(payload: DiscordPayload): string {
  const json = JSON.stringify(payload);
  return `<script id="discord:component-embed" type="application/json">\n${json}\n</script>`;
}
```

### 9.2 Linked

```ts
export function toLinkedSnippet(url: string): string {
  return `<link\n  rel="discord:component-embed"\n  type="application/json"\n  href="${url}"\n>`;
}

export function toLinkedJsonFile(payload: DiscordPayload): Blob {
  return new Blob([JSON.stringify(payload)], { type: "application/json" });
}
```

**Extra validation:** for linked mode, the JSON must be ≤ 3,000 bytes, the UI shows a hard warning and disables the copy button when over.

---

## 10. State Management (Zustand)

### 10.1 Store Slices

```ts
interface Store {
  // document
  doc: DocumentState;
  addNode: (
    parentId: NodeId | null,
    type: ComponentType,
    index?: number,
  ) => NodeId;
  updateNode: <T extends BuilderNode>(id: NodeId, patch: Partial<T>) => void;
  moveNode: (id: NodeId, newParentId: NodeId, index: number) => void;
  removeNode: (id: NodeId) => void;
  select: (id: NodeId | null) => void;

  // history
  undo: () => void;
  redo: () => void;

  // persistence
  loadFromLocalStorage: () => void;
  exportSnapshot: () => string;
  importSnapshot: (json: string) => void;
}
```

### 10.2 Undo/Redo

Snapshot = `{ nodes, rootId }` shallow-cloned via `structuredClone`. Keep max 20. Triggered by major mutation actions (not every keystroke, 300ms debounce for text edits).

---

## 11. Preview Rendering

Preview does **not** use an iframe, it renders directly with Tailwind to control styling. Each type has its own renderer component:

| Type | Renderer                | Notes                                                 |
| ---- | ----------------------- | ----------------------------------------------------- |
| 17   | `<ContainerPreview>`    | border-left accent color, radius 8px, dark background |
| 9    | `<SectionPreview>`      | flex row: text + accessory                            |
| 10   | `<TextDisplayPreview>`  | markdown-it → sanitize → HTML                         |
| 2    | `<ButtonPreview>`       | link style (secondary)                                |
| 11   | `<ThumbnailPreview>`    | aspect-square, rounded                                |
| 12   | `<MediaGalleryPreview>` | 2-column grid                                         |
| 14   | `<SeparatorPreview>`    | line + spacing                                        |
| 1    | `<ActionRowPreview>`    | flex row                                              |

**Markdown sanitization:** use `DOMPurify` to prevent XSS from user input (even for private previews).

---

## 12. Persistence

| Mechanism                       | Contents                  | When                        |
| ------------------------------- | ------------------------- | --------------------------- |
| `localStorage['embedlint:doc']` | Tree snapshot + timestamp | 500ms debounce per mutation |
| URL `#d=<base64-lz>`            | Compressed snapshot       | "Share link" button         |
| File `.json`                    | Full snapshot             | Manual export/import        |

**Base64 + LZ-String** for the URL hash to stay under practical URL length limits.

---

## 13. Deployment (Cloudflare Pages)

### 13.1 Build

```bash
next build    # output: 'export' → ./out
```

`next.config.mjs`:

```ts
export default {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
```

### 13.2 Cloudflare Pages Config

- **Build command:** `npm run build`
- **Build output directory:** `out`
- **Node version:** 20
- **Environment:** production & preview

### 13.3 Headers (`public/_headers`)

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
*/
```

### 13.4 Routing (`public/_redirects`)

```
/*  /index.html  200
```

---

## 14. Testing Strategy

| Level                             | Tool                 | Coverage Target            |
| --------------------------------- | -------------------- | -------------------------- |
| Unit (validator, serializer, hex) | Vitest               | ≥ 90%                      |
| Component                         | Testing Library      | Critical editors           |
| E2E (build → export)              | Playwright           | Golden path + 5 edge cases |
| Type                              | `tsc --noEmit` in CI | 100% strict                |

**Golden test:** 30+ test cases from the reference document (e.g. button with `custom_id` → invalid; 41 components → invalid; 2049-char media → invalid).

---

## 15. Performance Budget

| Asset          | Budget                                          |
| -------------- | ----------------------------------------------- |
| First Load JS  | < 250 KB gzip                                   |
| Monaco         | Lazy-loaded (dynamic import), < 300 KB separate |
| Preview render | < 16ms per update (60fps)                       |
| Validator run  | < 5ms for 40 components                         |

Optimizations:

- `next/dynamic` for Monaco and heavy panels.
- Granular Zustand selectors to avoid canvas re-renders.
- `useMemo` for serialize and validation results.

---

## 16. Security

- **Client-side only** → no server attack surface.
- Sanitize markdown output (DOMPurify) to prevent XSS via Text Display.
- `noopener noreferrer` on all preview `<a>` tags.
- No fetching of user URLs (v1), avoids SSRF/leaks.
- Strict CSP via `_headers`.

---

## 17. Extensibility

- Zod schema per component type → adding a new type means adding a schema file + renderer + editor.
- Registry pattern:

```ts
const COMPONENT_REGISTRY: Record<ComponentType, {
  schema: ZodSchema;
  editor: React.FC<EditorProps>;
  preview: React.FC<PreviewProps>;
  label: string;
  icon: LucideIcon;
  allowedParents: ComponentType[];
  allowedChildren: ComponentType[];
}> = { ... };
```

This makes adding a new component a **single edit point**.

---

## 18. Cross-References

- Validation rules → see `PRD.md §5.3`
- Visual design → see `DESIGN.md`
- Code conventions and AI agents → see `AGENTS.md`
