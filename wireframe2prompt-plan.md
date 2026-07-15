# Plano de Arquitetura — `wireframe2prompt`

Editor web de wireframes ASCII. O usuário arrasta componentes prontos (Button, Input, Card, etc.) sobre um grid de caracteres, ajusta posição/tamanho, e exporta uma string ASCII pura para usar como prompt em LLMs.

**Stack:** React + TypeScript + Vite (projeto já criado, ainda intocado).
**Arquitetura:** Clean Architecture (Domain → Application → Infrastructure → Presentation).

---

## Decisões de negócio (fechadas)

1. **Criação principal:** arrastar componentes prontos + ajustar (não desenho livre como protagonista).
2. **Pencil:** escreve **caractere bruto por célula** (sem reconhecimento de forma).
3. **Persistência:** **LocalStorage/IndexedDB** (via porta abstrata; começar com LocalStorage).
4. **Rasterização:** **compositor central** percorre o grid e desenha todos os elementos. O elemento NÃO se auto-renderiza.
5. **Sobreposição:** **último na ordem (maior z-index) vence** a célula.
6. **Célula:** largura fixa, 1 char por célula.
7. **Bordas:** ASCII puro (`+ - |`) por padrão, atrás de uma abstração de estilo (`BorderStyle`) para permitir Unicode depois.
8. **Output para LLM:** **string pura crua** (sem markdown, sem descrição).
9. **Undo/Redo:** essencial no MVP → domínio modelado com **comandos imutáveis + histórico**.

---

## Entidades de Domínio (núcleo)

```
Domain/
  entities/
    GridSize          { cols, rows }                     // o "plano"
    Position          { col, row }                        // coordenada em células
    Size              { width, height }                   // em células
    CellChar          // value object: 1 char, garante length === 1
    Layer             { id, name, visible, locked }        // metadados de camada
    Element (base)    { id, kind, position, size, zIndex, layer, props }
      ├─ BoxElement
      ├─ LineElement      { orientation: 'h' | 'v' }
      ├─ ArrowElement     { direction }
      ├─ TextElement      { text }
      ├─ ButtonElement    { label }
      ├─ InputElement     { placeholder }
      ├─ CardElement      { title? }
      ├─ TableElement     { columns, rows }
      ├─ ModalElement     { title? }
      ├─ TabsElement      { tabs: string[], active }
      └─ FreeDrawElement  { cells: Map<Position, CellChar> }  // pencil = chars brutos
  value-objects/
    BorderStyle         // { topLeft:'+', horizontal:'-', vertical:'|', ... } default ASCII
    CharBuffer          // matriz rows×cols de CellChar; método toString() → output cru
  aggregates/
    WireframeDocument   { id, name, gridSize, elements: Element[], layers }
                        // RAIZ DE AGREGAÇÃO. Mutações sempre retornam nova instância (imutável).
```

**Regras invariantes no domínio:**
- Elemento nunca pode ter `width/height <= 0`.
- Elemento pode extrapolar o grid? → **clamp** na rasterização (o compositor só desenha células dentro de `[0, cols) × [0, rows)`), mas a entidade aceita posições fora (permite arrastar pra fora e voltar).
- `WireframeDocument` é imutável: `addElement`, `moveElement`, `resizeElement`, `removeElement`, `reorder` retornam novo documento.

---

## Portas (interfaces) — o desacoplamento que você descreveu

### 1. Renderer (saída visual) — sua interface principal

```typescript
// Domain/ports/IElementRenderer.ts  (ou ICanvasRenderer)
interface IRenderer {
  clear(): void;
  drawChar(position: Position, char: CellChar): void;
  drawText(position: Position, text: string): void;
  present(): void; // flush
}
```

Implementações em Infrastructure/Presentation:
- `CanvasRenderer` → desenha numa `<canvas>` (texto monoespaçado).
- `DomCharRenderer` → uma `<div>`/`<span>` por célula (DOM grid).
- `StringRenderer` → acumula num `CharBuffer` e devolve a **string crua** (este é o que alimenta o LLM e os testes!).

> Ponto-chave de teste: o `StringRenderer` é determinístico → testes do compositor verificam a string exata.

### 2. Persistência

```typescript
// Domain/ports/IDocumentRepository.ts
interface IDocumentRepository {
  save(doc: WireframeDocument): Promise<void>;
  load(id: string): Promise<WireframeDocument | null>;
  list(): Promise<DocumentSummary[]>;
  delete(id: string): Promise<void>;
}
```
Implementação inicial: `LocalStorageDocumentRepository`. (IndexedDB depois sem tocar nos use cases.)

### 3. Compositor / Rasterizador (central)

```typescript
// Domain/ports/IComposer.ts
interface IComposer {
  // percorre elementos ordenados por zIndex e escreve no buffer; último vence
  compose(doc: WireframeDocument): CharBuffer;
}
```
Implementação: `ZIndexComposer`. Para cada `Element`, um `IElementGlyphMapper` traduz o elemento em células. Mapper por tipo (BoxGlyphMapper, CardGlyphMapper…), registrados num `GlyphMapperRegistry` → extensível sem `switch` gigante (Open/Closed).

---

## Application Layer — Use Cases (cada um com teste + mocks das deps)

Todos os use cases recebem suas portas por injeção. Nos testes, as portas são substituídas por **spies/mocks**.

```
Application/
  usecases/
    AddElementUseCase            (IDocumentRepository)
    MoveElementUseCase
    ResizeElementUseCase
    RemoveElementUseCase
    ReorderLayerUseCase          // muda z-index
    EditElementPropsUseCase      // texto, label, etc.
    DrawFreeCharUseCase          // pencil → CellChar bruto
    EraseCellUseCase
    ComposeAsciiUseCase          (IComposer)        → produz CharBuffer
    ExportAsciiUseCase           (IComposer)        → string crua p/ LLM (clipboard)
    SaveDocumentUseCase          (IDocumentRepository)
    LoadDocumentUseCase          (IDocumentRepository)
    UndoUseCase                  (IHistory)
    RedoUseCase                  (IHistory)
  history/
    ICommand                     { execute(doc): doc; undo(doc): doc }  // ou snapshot
    IHistory                     { push(cmd); undo(); redo(); canUndo; canRedo }
    InMemoryHistory              // pilhas undo/redo
```

**Estratégia Undo/Redo recomendada (mais simples e robusta):**
Como `WireframeDocument` é imutável, use **snapshots**: cada use case que muta o doc, antes de aplicar, empilha o documento anterior no `IHistory`. Undo = restaurar snapshot anterior. Evita escrever `undo()` manual por comando. (Se quiser memória menor depois, troca para command pattern com diff — a porta `IHistory` não muda.)

---

## Infrastructure / Presentation

```
Infrastructure/
  persistence/LocalStorageDocumentRepository.ts
  rendering/CanvasRenderer.ts
  rendering/DomCharRenderer.ts
  rendering/StringRenderer.ts
  composer/ZIndexComposer.ts
  composer/mappers/*GlyphMapper.ts
  composer/GlyphMapperRegistry.ts

Presentation/ (React)
  components/
    Toolbar/            // Select, Box, Line, Arrow, Pencil, Eraser
    ComponentPalette/   // Button, Input, Card, Table, Modal, Tabs
    Canvas/             // monta o IRenderer escolhido
    LayersPanel/
    InspectorPanel/     // editar props do elemento selecionado
    AsciiOutput/        // botão "Copy" → ExportAsciiUseCase
  hooks/
    useEditorStore      // estado de UI: ferramenta ativa, seleção, doc atual
  di/
    container.ts        // injeta implementações nas portas (composition root)
```

**Estado de UI vs Domínio:** estado de interação (ferramenta ativa, seleção, hover) vive na Presentation (Zustand ou Context+useReducer recomendado). O `WireframeDocument` é o estado de domínio, mutado só via use cases.

---

## Estratégia de testes (requisito do projeto)

- Ferramenta: **Vitest** (+ Testing Library para componentes, opcional no MVP).
- **Todo use case tem teste.** As portas-dependência viram **spies/mocks**:
  - `SpyDocumentRepository` — registra chamadas a `save/load`, retorna valores controlados.
  - `SpyComposer`, `SpyHistory`, `FakeRenderer`.
- **Domínio:** testes puros de invariantes e imutabilidade (entidades + value objects).
- **Compositor:** testes contra `StringRenderer`/`CharBuffer.toString()` comparando a **string ASCII exata** (golden tests) — ex: um Box 4×3 produz exatamente:
  ```
  +--+
  |  |
  +--+
  ```
- **Undo/Redo:** sequência de use cases → `UndoUseCase` restaura snapshot anterior verificável.

Padrão de mock sugerido (sem libs extras):
```typescript
class SpyDocumentRepository implements IDocumentRepository {
  saveCalls: WireframeDocument[] = [];
  async save(doc) { this.saveCalls.push(doc); }
  // ...
}
```

---

## Ordem de implementação sugerida (para o Claude Code)

1. **Domain:** value objects (`CellChar`, `Position`, `Size`, `GridSize`, `BorderStyle`, `CharBuffer`), entidades de `Element` + `WireframeDocument` imutável. **Com testes.**
2. **Portas:** `IRenderer`, `IComposer`, `IDocumentRepository`, `IHistory`, `ICommand`, `IGlyphMapper`.
3. **Compositor:** `ZIndexComposer` + mappers (Box, Line, Text primeiro) + `StringRenderer`. **Golden tests.**
4. **Use cases** + spies/mocks. **Testes obrigatórios.**
5. **Infra:** `LocalStorageDocumentRepository`, `InMemoryHistory`.
6. **DI container** (composition root).
7. **Presentation:** Canvas (DomCharRenderer primeiro, mais simples que canvas), Toolbar, Palette, Layers, Inspector, AsciiOutput.
8. Mappers restantes (Card, Table, Modal, Tabs, Arrow, FreeDraw) incrementalmente, cada um com golden test.

---

## Regra de dependência (Clean)

```
Presentation ──► Application ──► Domain ◄── Infrastructure
```
- Domain não importa nada de fora.
- Application depende só de Domain (e de portas definidas no Domain).
- Infrastructure e Presentation implementam/consomem portas; ligadas só no `di/container.ts`.
- Nenhum use case conhece React, LocalStorage ou `<canvas>`.
