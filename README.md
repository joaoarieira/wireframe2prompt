# wireframe2prompt

A web editor for **ASCII wireframes**. You drag ready-made components
(Box, Input, Card, Table, Modal, Tabs, …) onto a character grid, position and
resize them, and export a **raw ASCII string** to paste as a prompt into an
LLM. The export is the plain string only — no markdown, no description.

```
+------------------------+
|  Login                 |
|  [______________]      |
|  [______________]      |
|  ( Sign in )           |
+------------------------+
```

> **New here? Read [`CLAUDE.md`](./CLAUDE.md) too.** It is the binding
> engineering contract (layering rules, conventions, style, test/coverage
> requirements). This README is the map; `CLAUDE.md` is the law.

---

## Quick start

**Prerequisites:** Node 20+ and **[pnpm](https://pnpm.io/)**.

> ⚠️ Install with **pnpm only**. `npm install` breaks on this repo (workspace
> protocol + peer resolution). Do not switch package managers.

```bash
pnpm install       # install dependencies
pnpm dev           # start Vite dev server (http://localhost:5173)
pnpm test          # Vitest in watch mode
pnpm build         # type-check (tsc -b) + production build
```

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server with HMR. |
| `pnpm build` | `tsc -b` (type-check, no emit) then `vite build`. |
| `pnpm preview` | Serve the production build locally. |
| `pnpm test` | Vitest **watch** mode. Use `pnpm exec vitest run` for a single pass. |
| `pnpm coverage` | Full suite with a V8 coverage report. |
| `pnpm lint` | ESLint over the whole project. |
| `pnpm exec tsc -b` | Type-check only. |

Formatting is Prettier (`pnpm exec prettier`); style is not up for debate.

---

## Tech stack

- **React 19** + **TypeScript** + **Vite 8** (with the React Compiler via Babel).
- **State:** [Zustand](https://github.com/pmndrs/zustand) — one editor store.
- **Routing:** TanStack Router.
- **UI:** Tailwind CSS v4 + **daisyUI** (quarantined — see below).
- **i18n:** i18next / react-i18next (English + Portuguese).
- **Tests:** Vitest + Testing Library, jsdom environment.

---

## Architecture — Clean Architecture

The **dependency rule** is the framework convention here: imports only ever
point **inward**. Domain knows nothing about React, storage, or the DOM.

```
Presentation ──► Application ──► Domain ◄── Infrastructure
```

- **Domain** (`src/domain/`) — pure entities, value objects, the
  `WireframeDocument` aggregate root, and the **ports** (interfaces) it needs.
  Imports nothing from the other layers.
- **Application** (`src/application/`) — use cases. Depend only on Domain + its
  ports. No use case knows about React, LocalStorage, or `<canvas>`.
- **Infrastructure** (`src/infrastructure/`) — concrete adapters that
  *implement* ports (composer, renderer, LocalStorage repo, history, clock).
- **Presentation** (`src/presentation/`) — React, routing, state, UI, i18n.
- **DI composition root** (`src/di/container.ts`) is the *only* place that wires
  concrete adapters into use cases. Everything else depends on ports.

### Layer map

```
src/
  domain/
    entities/        GridSize, Position, Size, CellChar, Layer,
                     element/ (Box, Line, Text, Card, Table, Modal, Tabs,
                               Arrow, FreeDraw, Input, Dropdown, Field, Multiline)
    value-objects/   BorderStyle, CharBuffer
    aggregates/      WireframeDocument (immutable aggregate root)
    entities/errors/ domain error types (InvalidPositionError, …)
    ports/           IRenderer, IComposer, IDocumentRepository, IHistory,
                     ICommand, IGlyphMapper, IClock
  application/
    usecases/        AddElement(s), MoveElement(s), ResizeElement, ResizeGrid,
                     RemoveElement(s), ReorderLayer(s), EditElementProps,
                     ComposeAscii, ExportAscii, Save/LoadDocument, Undo, Redo,
                     DrawFreeChar, EraseCell
  infrastructure/
    composer/        ZIndexComposer, GlyphMapperRegistry, defaultRegistry,
                     mappers/*GlyphMapper
    rendering/       StringRenderer
    persistence/     WebStorage (port shim), LocalStorageDocumentRepository,
                     documentSerialization
    history/         InMemoryHistory
    time/            SystemClock
  presentation/
    pages/           DocumentListPage, EditorPage, AboutPage
    components/      Canvas, LayersSidebar, InspectorPanel, EditorTopBar, …
    state/           editor-store (Zustand), app-store, tools, hit-test
    ui/              design-system primitives (the only daisyUI surface)
    i18n/            i18n setup + locales/{en,pt}.ts + detectLocale
    theme/           theme.ts (light/dark tokens)
    router.tsx, RootLayout.tsx
  di/                container.ts (composition root)
  tests/             doubles/ (Spy*/InMemory*), fixtures.ts, setup.ts
```

### The core render pipeline (read this to grok the app)

1. The user drags a component onto the grid → a Presentation event calls a
   **use case** (`AddElementUseCase`, …).
2. Use cases are **pure**: they take the current `WireframeDocument`, push the
   previous snapshot onto `IHistory`, and return a **new** document (the
   aggregate is immutable — mutators never mutate in place).
3. To display, the **compositor** (`ZIndexComposer`) walks elements in ascending
   z-index and asks each element's `IGlyphMapper` to write its cells into a
   `CharBuffer`. **Higher z-index wins** an overlapping cell (written last).
4. `StringRenderer` turns the `CharBuffer` into the exact raw ASCII string —
   the *same* deterministic path used by both the LLM export and the golden
   tests.

### Design rules you must not violate

- **The compositor rasterizes; elements never self-render.**
- **Per-type glyph mapping is Open/Closed.** Each element kind has an
  `IGlyphMapper` registered in `defaultRegistry.ts` — no giant `switch`. Adding
  an element type = add a mapper + register it.
- **Clamp on rasterization, never in the entity.** Elements may hold positions
  outside the grid (so they can be dragged out and back); the `CharBuffer`
  silently ignores writes outside `[0, cols) × [0, rows)`.
- **`WireframeDocument` is immutable** — every mutator returns a new document.
- **Undo/Redo = whole-document snapshots**, not per-command `undo()`.
- **Persistence is explicit** — no autosave. Mutation is pure and separate;
  saving goes through `SaveDocumentUseCase`.

---

## Conventions that bite if you miss them

- **Argument order is always X-then-Y.** `Position.create(col, row)`,
  `GridSize.create(cols, rows)`, `Size.create(width, height)` — column/width
  first, then row/height. Inverting a factory silently corrupts everything.
- **Value objects:** `private` constructor + `static create(...)` factory +
  `equals(other)`. Factories throw domain errors (in
  `src/domain/entities/errors/`) on invalid input; error messages must include
  the offending value.
- **Element ids are caller-provided** — the domain is pure, no `randomUUID`.
- **TypeScript flags:** `erasableSyntaxOnly` (no `enum`, no constructor
  parameter properties — assign fields in the body) and `verbatimModuleSyntax`
  (`import type` for type-only imports). `noUnusedLocals`/`Parameters` are on.
- **Specs are co-located** as `*.spec.ts` next to the code.
- **Code style:** functions 4–20 lines, files < 500 lines, early returns, max 2
  levels of indentation, no `any`.

---

## UI & the design-system quarantine

daisyUI is isolated so it can be swapped without touching features.

- **daisyUI classes** (`btn`, `input`, `select`, `join`, …) are **forbidden
  outside `src/presentation/ui/`**. Features compose the primitives exported
  there (`Button`, `TextInput`, `Select`, `List`, `Alert`, …).
- Need a new control? **Extend a primitive in `ui/`** (with a co-located spec
  asserting its class contract) — never reach for a raw daisyUI class in a
  feature.
- **Colors:** only semantic theme tokens (`base-100`, `base-content`,
  `primary`, `error`, …). No raw Tailwind colors (`red-500`), no `dark:`.
- Themes live in `src/index.css` / `presentation/theme`; a global visual change
  edits the theme, not components. `primary` appears once per screen.

## Internationalization

English (default) + Portuguese, via react-i18next. i18n is a **Presentation
concern only**.

- **Every user-facing string** (including `aria-label`, `placeholder`, `title`,
  `<option>` text) goes through `t("area.item")`. Never a literal.
- Dictionaries: `src/presentation/i18n/locales/{en,pt}.ts`. `en` is the source
  of truth; `pt` is typed against it, so `tsc` breaks if a key is missing or
  extra. **Every new key goes in both.**
- Domain / Application / Infrastructure — and `presentation/state` — never
  import i18n. State exposes i18n **keys**; components translate them.
- Never translate user data (document/element names) or the exported ASCII.

---

## Testing

- `pnpm test` (watch) / `pnpm exec vitest run` (single pass). Type-check with
  `pnpm exec tsc -b`.
- **Every new function gets a test; every bug fix gets a regression test.**
- The compositor is tested with **golden tests** — compose and assert the exact
  ASCII string (a 4×3 box is exactly `+--+` / `|  |` / `+--+`).
- Mock external I/O with the named fakes in `src/tests/doubles/` (`Spy*`,
  `InMemory*`), never inline stubs. Builders live in `src/tests/fixtures.ts`.
- Tests run pinned to English (`src/tests/setup.ts`); a test that switches to
  `"pt"` must restore `"en"` in `afterEach`.

### Coverage of changed files (hard requirement)

Every changed source file must hit **100%** (statements/branches/functions/
lines). Run the full suite but narrow the *report* to the files you touched —
one `--coverage.include` per changed file:

```bash
pnpm exec vitest run --coverage \
  --coverage.include='src/di/container.ts' \
  --coverage.include='src/infrastructure/persistence/documentSerialization.ts'
```

Clean = `100%` summary with an empty "Uncovered Line #s". `throw` branches are
the usual misses — drive each one.

---

## Recipe: add a new element type

The compositor is Open/Closed, so adding a component is additive:

1. **Entity** — add `src/domain/entities/element/FooElement.ts` (immutable value
   object with a `static create`), plus its `*.spec.ts`.
2. **Glyph mapper** — add
   `src/infrastructure/composer/mappers/FooGlyphMapper.ts` implementing
   `IGlyphMapper` (write the element's cells into the `CharBuffer`), plus a
   golden `*.spec.ts`.
3. **Register it** — add one `.register(new FooGlyphMapper())` line in
   `src/infrastructure/composer/defaultRegistry.ts`.
4. **Presentation** — expose the component in the palette/tools and add its
   i18n keys to **both** `en.ts` and `pt.ts`.

No `switch` statements to edit, and no other layer changes.
