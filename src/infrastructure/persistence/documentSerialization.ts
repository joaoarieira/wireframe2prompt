import { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../domain/entities/grid-size/GridSize";
import { Position } from "../../domain/entities/position/Position";
import { Size } from "../../domain/entities/size/Size";
import { Layer } from "../../domain/entities/layer/Layer";
import { BorderStyle } from "../../domain/value-objects/border-style/BorderStyle";
import type { BorderStyleName } from "../../domain/value-objects/border-style/BorderStyle";
import { CellChar } from "../../domain/entities/cell-char/CellChar";
import { BoxElement } from "../../domain/entities/element/BoxElement";
import { LineElement } from "../../domain/entities/element/LineElement";
import { TextElement } from "../../domain/entities/element/TextElement";
import { ArrowElement } from "../../domain/entities/element/ArrowElement";
import { CardElement } from "../../domain/entities/element/CardElement";
import { ModalElement } from "../../domain/entities/element/ModalElement";
import { TableElement } from "../../domain/entities/element/TableElement";
import { TabsElement } from "../../domain/entities/element/TabsElement";
import { InputElement } from "../../domain/entities/element/InputElement";
import { DropdownElement } from "../../domain/entities/element/DropdownElement";
import { ButtonElement } from "../../domain/entities/element/ButtonElement";
import { FreeDrawElement } from "../../domain/entities/element/FreeDrawElement";
import { MultilineElement } from "../../domain/entities/element/MultilineElement";
import type { MultilinePoint } from "../../domain/entities/element/MultilineElement";
import type {
  Element,
  ElementBaseProps,
} from "../../domain/entities/element/Element";
import type { LineOrientation } from "../../domain/entities/element/LineElement";
import type { ArrowDirection } from "../../domain/entities/element/ArrowElement";

/**
 * Persistence format version. Bumped when the on-disk shape changes so old
 * payloads can be rejected (or migrated) instead of silently mis-parsed.
 */
export const DOCUMENT_SCHEMA_VERSION = 1;

interface SerializedGridSize {
  cols: number;
  rows: number;
}

interface SerializedPosition {
  col: number;
  row: number;
}

interface SerializedSize {
  width: number;
  height: number;
}

interface SerializedLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

interface SerializedElementBase {
  id: string;
  kind: string;
  position: SerializedPosition;
  size: SerializedSize;
  zIndex: number;
  layerId: string | null;
  /** Optional: absent in payloads written before the field existed. */
  name?: string | null;
  /** Border style name; present only for bordered kinds. Absent → square. */
  borderStyle?: BorderStyleName;
}

interface SerializedBoxElement extends SerializedElementBase {
  kind: "box";
}

interface SerializedLineElement extends SerializedElementBase {
  kind: "line";
  orientation: LineOrientation;
}

interface SerializedTextElement extends SerializedElementBase {
  kind: "text";
  text: string;
}

interface SerializedArrowElement extends SerializedElementBase {
  kind: "arrow";
  direction: ArrowDirection;
}

interface SerializedCardElement extends SerializedElementBase {
  kind: "card";
  title: string | null;
}

interface SerializedModalElement extends SerializedElementBase {
  kind: "modal";
  title: string | null;
}

interface SerializedTableElement extends SerializedElementBase {
  kind: "table";
  columns: number;
  rows: number;
}

interface SerializedTabsElement extends SerializedElementBase {
  kind: "tabs";
  tabs: string[];
  active: number;
}

/** Shared shape of input and dropdown elements: three optional text slots. */
interface SerializedFieldElement extends SerializedElementBase {
  kind: "input" | "dropdown";
  label: string | null;
  placeholder: string | null;
  hint: string | null;
}

interface SerializedButtonElement extends SerializedElementBase {
  kind: "button";
  text: string;
}

interface SerializedFreeDrawElement extends SerializedElementBase {
  kind: "freedraw";
  /** JSON cannot represent Map; cells are stored as a plain object. */
  cells: Record<string, string>;
}

interface SerializedMultilineElement extends SerializedElementBase {
  kind: "multiline";
  /** Vertices relative to `position` (the polyline's bounding-box top-left). */
  points: MultilinePoint[];
}

type SerializedElement =
  | SerializedBoxElement
  | SerializedLineElement
  | SerializedTextElement
  | SerializedArrowElement
  | SerializedCardElement
  | SerializedModalElement
  | SerializedTableElement
  | SerializedTabsElement
  | SerializedFieldElement
  | SerializedButtonElement
  | SerializedFreeDrawElement
  | SerializedMultilineElement;

export interface SerializedDocument {
  version: number;
  id: string;
  name: string;
  gridSize: SerializedGridSize;
  elements: SerializedElement[];
  layers: SerializedLayer[];
  /** Epoch ms of the last edit. Optional: absent in pre-lastEdit payloads. */
  lastEdit?: number;
}

function serializeBase(element: Element): SerializedElementBase {
  const base: SerializedElementBase = {
    id: element.id,
    kind: element.kind,
    position: { col: element.position.col, row: element.position.row },
    size: { width: element.size.width, height: element.size.height },
    zIndex: element.zIndex,
    layerId: element.layerId,
    name: element.name,
  };
  if (element.hasBorder) {
    // Store the name; a hand-built custom style falls back to the default.
    base.borderStyle = BorderStyle.nameOf(element.borderStyle) ?? "square";
  }
  return base;
}

function serializeElement(element: Element): SerializedElement {
  const base = serializeBase(element);
  if (element instanceof BoxElement) {
    return { ...base, kind: "box" };
  }
  if (element instanceof LineElement) {
    return { ...base, kind: "line", orientation: element.orientation };
  }
  if (element instanceof TextElement) {
    return { ...base, kind: "text", text: element.text };
  }
  if (element instanceof ArrowElement) {
    return { ...base, kind: "arrow", direction: element.direction };
  }
  if (element instanceof CardElement) {
    return { ...base, kind: "card", title: element.title };
  }
  if (element instanceof ModalElement) {
    return { ...base, kind: "modal", title: element.title };
  }
  if (element instanceof TableElement) {
    return {
      ...base,
      kind: "table",
      columns: element.columns,
      rows: element.rows,
    };
  }
  if (element instanceof TabsElement) {
    return {
      ...base,
      kind: "tabs",
      tabs: [...element.tabs],
      active: element.active,
    };
  }
  if (element instanceof InputElement || element instanceof DropdownElement) {
    return {
      ...base,
      kind: element.kind,
      label: element.label,
      placeholder: element.placeholder,
      hint: element.hint,
    };
  }
  if (element instanceof ButtonElement) {
    return { ...base, kind: "button", text: element.text };
  }
  if (element instanceof FreeDrawElement) {
    const cells: Record<string, string> = {};
    for (const [key, char] of element.cells) {
      cells[key] = char.value;
    }
    return { ...base, kind: "freedraw", cells };
  }
  if (element instanceof MultilineElement) {
    return {
      ...base,
      kind: "multiline",
      points: element.points.map((p) => ({ ...p })),
    };
  }
  throw new Error(
    `Cannot serialize element of unknown kind "${element.kind}" (id "${element.id}"); expected box | line | text | arrow | card | modal | table | tabs | input | dropdown | button | freedraw | multiline`,
  );
}

function serializeLayer(layer: Layer): SerializedLayer {
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
  };
}

export function serializeDocument(doc: WireframeDocument): SerializedDocument {
  return {
    version: DOCUMENT_SCHEMA_VERSION,
    id: doc.id,
    name: doc.name,
    gridSize: { cols: doc.gridSize.cols, rows: doc.gridSize.rows },
    elements: doc.elements.map(serializeElement),
    layers: doc.layers.map(serializeLayer),
    lastEdit: doc.lastEdit,
  };
}

function deserializeBase(data: SerializedElementBase): ElementBaseProps {
  return {
    id: data.id,
    position: Position.create(data.position.col, data.position.row),
    size: Size.create(data.size.width, data.size.height),
    zIndex: data.zIndex,
    layerId: data.layerId,
    // ?? null keeps version-1 payloads written before `name` existed loadable.
    name: data.name ?? null,
    // A string names one of the three styles; anything else (absent, or an old
    // object-form borderStyle) leaves it undefined → the element defaults to square.
    borderStyle:
      typeof data.borderStyle === "string"
        ? BorderStyle.named(data.borderStyle)
        : undefined,
  };
}

function deserializeElement(data: SerializedElement): Element {
  const base = deserializeBase(data);
  switch (data.kind) {
    case "box":
      return BoxElement.create(base);
    case "line":
      return LineElement.create({ ...base, orientation: data.orientation });
    case "text":
      return TextElement.create({ ...base, text: data.text });
    case "arrow":
      return ArrowElement.create({ ...base, direction: data.direction });
    case "card":
      return CardElement.create({ ...base, title: data.title });
    case "modal":
      return ModalElement.create({ ...base, title: data.title });
    case "table":
      return TableElement.create({
        ...base,
        columns: data.columns,
        rows: data.rows,
      });
    case "tabs":
      return TabsElement.create({
        ...base,
        tabs: data.tabs,
        active: data.active,
      });
    case "input":
      return InputElement.create({
        ...base,
        label: data.label,
        placeholder: data.placeholder,
        hint: data.hint,
      });
    case "dropdown":
      return DropdownElement.create({
        ...base,
        label: data.label,
        placeholder: data.placeholder,
        hint: data.hint,
      });
    case "button":
      return ButtonElement.create({ ...base, text: data.text });
    case "freedraw": {
      const cells = new Map<string, CellChar>();
      for (const [key, value] of Object.entries(data.cells)) {
        cells.set(key, CellChar.create(value));
      }
      // FreeDrawElement.create recomputes size from cells; base.size is ignored.
      return FreeDrawElement.create({
        id: base.id,
        position: base.position,
        zIndex: base.zIndex,
        layerId: base.layerId,
        name: base.name,
        cells,
      });
    }
    case "multiline": {
      // Points are stored relative to position; rebuild absolute coordinates so
      // create can recompute the origin/size (base.position/size are ignored).
      const origin = base.position;
      const points = data.points.map((point) => ({
        col: origin.col + point.col,
        row: origin.row + point.row,
      }));
      return MultilineElement.create({
        id: base.id,
        zIndex: base.zIndex,
        layerId: base.layerId,
        name: base.name,
        borderStyle: base.borderStyle,
        points,
      });
    }
    default:
      throw new Error(
        `Cannot deserialize element of unknown kind "${(data as SerializedElementBase).kind}"; expected box | line | text | arrow | card | modal | table | tabs | input | dropdown | button | freedraw | multiline`,
      );
  }
}

export function deserializeDocument(
  data: SerializedDocument,
): WireframeDocument {
  if (data.version !== DOCUMENT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported document schema version ${data.version}; expected ${DOCUMENT_SCHEMA_VERSION}`,
    );
  }
  return WireframeDocument.create({
    id: data.id,
    name: data.name,
    gridSize: GridSize.create(data.gridSize.cols, data.gridSize.rows),
    elements: data.elements.map(deserializeElement),
    layers: data.layers.map((layer) => Layer.create(layer)),
    // ?? 0 keeps payloads written before `lastEdit` existed loadable.
    lastEdit: data.lastEdit ?? 0,
  });
}
