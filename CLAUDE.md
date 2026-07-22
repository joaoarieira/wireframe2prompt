# wireframe2prompt

Web editor for **ASCII wireframes**. The user drags ready-made components
(Box, Input, Card, Table, Modal, …) onto a character grid, adjusts
position/size, and exports a **raw ASCII string** to feed as a prompt to an
LLM. Output is the plain string — no markdown, no description.

**Stack:** React 19 + TypeScript + Vite. Tests: Vitest. See `README.md` for the
project overview and onboarding; this file is the working contract for how to
change the code.

---

## Architecture — Clean Architecture

Dependency rule (imports only ever point inward):

```
Presentation ──► Application ──► Domain ◄── Infrastructure
```

- **Domain** imports nothing from outside. Pure entities, value objects,
  aggregates, and the **ports** (interfaces) it needs.
- **Application** (use cases) depends only on Domain + its ports. No use case
  knows about React, LocalStorage, or `<canvas>`.
- **Infrastructure** and **Presentation** implement/consume ports; they are
  wired together only in the DI composition root (`di/container.ts`).

Layer map (`src/`):

```
domain/
  entities/        GridSize, Position, Size, CellChar, Layer, and
                   element/ (Box, Line, Text, Card, Table, Modal, Tabs, Arrow,
                             Input, Dropdown, Field, Multiline, FreeDraw)
  value-objects/   BorderStyle, CharBuffer
  aggregates/      WireframeDocument   (aggregate root, immutable)
  entities/errors/ domain error types (InvalidPositionError, …)
  ports/           IRenderer, IComposer, IDocumentRepository, IHistory,
                   ICommand, IGlyphMapper, IClock
application/
  usecases/        AddElement(s), MoveElement(s), ResizeElement, ResizeGrid,
                   RemoveElement(s), ReorderLayer(s), EditElementProps,
                   ComposeAscii, ExportAscii, SaveDocument, LoadDocument,
                   Undo, Redo, DrawFreeChar, EraseCell
infrastructure/
  composer/        ZIndexComposer, GlyphMapperRegistry, defaultRegistry,
                   mappers/*GlyphMapper
  rendering/       StringRenderer
  persistence/     WebStorage (port shim), LocalStorageDocumentRepository,
                   documentSerialization
  history/         InMemoryHistory
  time/            SystemClock
di/                container.ts   (composition root — wires adapters to use cases)
tests/
  doubles/         SpyComposer, SpyHistory, SpyDocumentRepository,
                   InMemoryWebStorage, FixedClock, FakeToolContext
  fixtures.ts      makeBox / makeText / makeDoc builders
```

The whole Presentation/React layer lives under `presentation/` (pages, router,
Zustand editor store, canvas tools, UI primitives, i18n, theme) — see
`README.md` for that map.

### Core design rules (do not violate)

- **Central compositor rasterizes; elements never self-render.** `IComposer`
  walks elements ordered by ascending z-index and writes each one's cells into
  a `CharBuffer`. **Higher z-index wins** an overlapping cell (written last).
- **Per-type glyph mapping is Open/Closed.** Each element kind has an
  `IGlyphMapper` registered in `GlyphMapperRegistry` — no giant `switch`. Add a
  new element type = add a mapper + register it.
- **Clamp on rasterization.** Elements may hold positions outside the grid (so
  they can be dragged out and back); the buffer silently ignores writes outside
  `[0, cols) × [0, rows)`. Never clamp in the entity.
- **`WireframeDocument` is immutable.** `addElement`, `moveElement`,
  `resizeElement`, `removeElement`, `reorder` return a new document.
- **Persistence is separate from mutation.** Mutation use cases are pure and
  depend only on `IHistory` (they push the previous snapshot). There is **no
  autosave** — persistence goes through `SaveDocumentUseCase` explicitly.
- **Undo/Redo = snapshots**, not per-command `undo()`: because the document is
  immutable, history stacks whole previous documents.
- **`StringRenderer` is the deterministic output path.** It accumulates into a
  `CharBuffer` and yields the exact raw string — it feeds both the LLM export
  and the golden tests.

### Current status

All layers are implemented and under active development. Domain, every use
case, the compositor with all element mappers (Box, Line, Text, Card, Table,
Modal, Tabs, Arrow, Input, Dropdown, Field, Multiline, FreeDraw), the
`StringRenderer`, LocalStorage persistence + serialization, `InMemoryHistory`,
`SystemClock`, and the DI container are in place with tests. The Presentation
layer is a working React app — document list / editor / about pages, a Zustand
editor store, the canvas (place/select/move/resize, free-draw, pan-zoom, inline
editing), layers sidebar, inspector, undo/redo, copy-to-clipboard export, i18n
(en/pt), and light/dark themes. When you finish a slice, update this section so
it keeps describing what actually exists.

---

## Critical conventions

- **Argument order is always X-then-Y.** `Position.create(col, row)`,
  `GridSize.create(cols, rows)`, `Size.create(width, height)` — column/width
  (X axis) first, then row/height (Y axis). All production code assumes this;
  inverting only the factories silently corrupts everything. Keep it consistent.
- **`CharBuffer` lives in `domain/value-objects/char-buffer/`** and is the
  canonical one (`create(gridSize)`, `set`/`charAt`, `width`/`height`,
  `toString()` = full rectangular grid, rows joined by `\n`, **no trailing
  newline**).
- **Value objects:** `private` constructor + `static create(...)` factory +
  `equals(other)`. Domain errors live in `src/domain/entities/errors/` and are
  thrown by the factories on invalid input.
- **Element ids are caller-provided** — the domain is pure, no `randomUUID`.
- **TypeScript flags:** `erasableSyntaxOnly` (no enums, no constructor
  parameter properties — assign fields in the body) and `verbatimModuleSyntax`
  (use `import type` for type-only imports). `noUnusedLocals`/`Parameters` are on.
- **Specs are co-located** with the code as `*.spec.ts`.

---

## Internationalization (i18n)

The app ships **English (default) and Portuguese** via `react-i18next`. i18n is a
Presentation concern only.

- **Every user-facing string** in Presentation — including `aria-label`,
  `placeholder`, `title`, and `<option>` text — goes through `t("key")` from
  `useTranslation()`. **Never** a string literal.
- **Dictionaries** live in `src/presentation/i18n/locales/{en,pt}.ts`. `en` is
  the source of truth; `pt` is typed as `LocaleDictionary` (derived from `en`),
  so `tsc` breaks if a key is missing or extra. **Every new key goes in both.**
- **Key convention:** `area.item` (e.g. `inspector.delete`, `toolbar.undo`).
  Interpolation uses `{{name}}` — pass `t("layers.bringForward", { name })`.
- **Domain / Application / Infrastructure never import i18n.** Neither does the
  `presentation/state` layer: it exposes i18n **keys** (e.g.
  `CanvasTool.labelKey`) and the component translates them with `t(...)`.
- **Exception / developer messages are not translated** — they stay English and
  must still include the offending value.
- **Never translate user data** (document/element names, ids) or the exported
  **ASCII output**. The product name `wireframe2prompt` is also not translated.
- **Tests** run with the language pinned to `"en"` in `src/tests/setup.ts`; spec
  queries (`getByText`/`getByLabelText`) use the `en.ts` strings. A test that
  calls `i18n.changeLanguage("pt")` must restore `"en"` in `afterEach`.
- `detectLocale(language)` (pure) maps a `pt*` tag to Portuguese, else English;
  `i18n.ts` wires the instance and is imported by `main.tsx` before render.

---

## UI & styling

The design system is quarantined so it can be swapped without touching features.

- **daisyUI component classes** (`btn`, `join`, `input`, `textarea`, `select`,
  `fieldset`, `list`, `list-row`, `link`, `alert`, `loading`, `navbar`,
  `rounded-box`, …) are **forbidden outside `src/presentation/ui/`**. Features
  compose the primitives there (`Button`, `ButtonLink`, `ButtonGroup`,
  `TextInput`, `TextArea`, `Select`, `Field`/`FieldLabel`, `List`/`ListRow`/
  `ListCell`, `TextLink`, `Alert`, `Spinner`, `FloatingBar`).
- **Need a new control?** Create or extend a primitive in
  `src/presentation/ui/` (with a co-located spec that asserts its class
  contract) — never reach for the raw daisyUI class in a feature.
- **Colors:** only semantic theme tokens (`base-100/200/300`, `base-content`,
  `primary`, `neutral`, `error`, …). Never raw Tailwind colors (`red-500`) and
  never `dark:` — the active theme resolves light/dark automatically.
- **Tailwind in features:** layout / spacing / typography utilities only
  (`flex`, `gap-2`, `p-4`, `w-16`, `truncate`, `text-sm`).
- **Themes** live in `src/index.css` (`wireframe-light` default,
  `wireframe-dark` via `prefersdark`). A global visual change = edit the theme,
  not the components. All daisyUI theme variables are required.
- **`primary` appears once per screen** — the single most important action.
- Primitives forward native props via `...rest` and accept `className` for
  **layout only**; the design-system classes are computed inside the primitive
  (see `ui/button/buttonClasses.ts`). The `ui/` folder is the only swap surface.

---

## Code style

- Functions: 4-20 lines. Split if longer.
- Files: under 500 lines. Split by responsibility.
- One thing per function, one responsibility per module (SRP).
- Names: specific and unique. Avoid `data`, `handler`, `Manager`.
  Prefer names that return <5 grep hits in the codebase.
- Types: explicit. No `any`, no `Dict`, no untyped functions.
- No code duplication. Extract shared logic into a function/module.
- Early returns over nested ifs. Max 2 levels of indentation.
- Exception messages must include the offending value and expected shape.

## Comments

- Keep your own comments. Don't strip them on refactor — they carry
  intent and provenance.
- Write WHY, not WHAT. Skip `// increment counter` above `i++`.
- Docstrings on public functions: intent + one usage example.
- Reference issue numbers / commit SHAs when a line exists because
  of a specific bug or upstream constraint.

## Tests

- Tests run with a single command: `pnpm test` (Vitest watch mode; use
  `pnpm exec vitest run` for a single non-watch run). Type-check with
  `pnpm exec tsc -b`. (This repo uses **pnpm**; `npm install` breaks it.)
- Every new function gets a test. Bug fixes get a regression test.
- Mock external I/O (API, DB, filesystem) with named fake classes,
  not inline stubs. Reuse the `Spy*` doubles in `src/tests/doubles/`.
- Tests must be F.I.R.S.T: fast, independent, repeatable,
  self-validating, timely.
- The compositor is tested with **golden tests**: compose against the
  `StringRenderer`/`CharBuffer.toString()` and assert the exact ASCII string
  (e.g. a 4×3 box is exactly `+--+` / `|  |` / `+--+`).

### Coverage of changed files

On every change, each changed source file must reach **100%** coverage
(statements/branches/functions/lines). Run the full suite but narrow the
_report_ to the files you touched — add **one `--coverage.include` for every
changed file** so the report covers all of them, not just one:

```
npx vitest run --coverage --coverage.include='src/di/container.ts' --coverage.include='src/infrastructure/persistence/documentSerialization.ts'
```

Clean = `100%` summary, empty "Uncovered Line #s". Don't narrow by running one
spec file — that hides cross-file tests and flags the rest as uncovered.
`throw` branches are the usual misses; drive each one (e.g.
`vi.stubGlobal("localStorage", undefined)`). If a line truly can't be hit, say
why in the commit.

## Dependencies

- Inject dependencies through constructor/parameter, not global/import.
- Wrap third-party libs behind a thin interface owned by this project.
- New capabilities that touch the outside world (storage, rendering, history)
  go behind a Domain **port**; implementations live in Infrastructure and are
  wired only in the DI composition root.

## Structure

- Follow the Clean Architecture layering above — the dependency rule is the
  framework convention here. Domain never imports outward.
- Prefer small focused modules over god files.
- Predictable paths: each unit in its own folder with its co-located spec
  (`entities/position/Position.ts` + `Position.spec.ts`).

## Formatting

- Use the language default formatter (Prettier — `pnpm exec prettier`). ESLint
  via `pnpm lint`. Don't discuss style beyond that.

## Logging

- Structured JSON when logging for debugging / observability.
- Plain text only for user-facing CLI output.
