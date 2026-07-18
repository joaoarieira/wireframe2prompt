import { describe, expect, test } from "vitest";
import {
  DOCUMENT_SCHEMA_VERSION,
  deserializeDocument,
  serializeDocument,
} from "./documentSerialization";
import type { SerializedDocument } from "./documentSerialization";
import { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../domain/entities/grid-size/GridSize";
import { Position } from "../../domain/entities/position/Position";
import { Size } from "../../domain/entities/size/Size";
import { Layer } from "../../domain/entities/layer/Layer";
import { BorderStyle } from "../../domain/value-objects/border-style/BorderStyle";
import { CellChar } from "../../domain/entities/cell-char/CellChar";
import { BoxElement } from "../../domain/entities/element/BoxElement";
import { LineElement } from "../../domain/entities/element/LineElement";
import { TextElement } from "../../domain/entities/element/TextElement";
import { ArrowElement } from "../../domain/entities/element/ArrowElement";
import { CardElement } from "../../domain/entities/element/CardElement";
import { ModalElement } from "../../domain/entities/element/ModalElement";
import { TableElement } from "../../domain/entities/element/TableElement";
import { TabsElement } from "../../domain/entities/element/TabsElement";
import {
  FreeDrawElement,
  freeDrawCellKey,
} from "../../domain/entities/element/FreeDrawElement";
import { Element } from "../../domain/entities/element/Element";
import type { ElementBaseProps } from "../../domain/entities/element/Element";

/** Element subtype with no serializer registered — exercises the serialize guard. */
class UnmappedElement extends Element {
  readonly kind = "carousel";

  constructor(base: ElementBaseProps) {
    super(base);
  }

  protected cloneWith(): Element {
    return this;
  }

  protected withKindProps(): Element {
    return this;
  }
}

const unicodeBorder = BorderStyle.create({
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
});

function richDocument(): WireframeDocument {
  return WireframeDocument.create({
    id: "doc-42",
    name: "Login screen",
    gridSize: GridSize.create(30, 12),
    elements: [
      BoxElement.create({
        id: "box",
        position: Position.create(1, 2),
        size: Size.create(10, 4),
        zIndex: 0,
        layerId: "layer-1",
        name: "Frame",
        borderStyle: unicodeBorder,
      }),
      LineElement.create({
        id: "line",
        position: Position.create(3, 8),
        size: Size.create(6, 1),
        zIndex: 2,
        layerId: null,
        orientation: "h",
      }),
      TextElement.create({
        id: "text",
        position: Position.create(2, 3),
        size: Size.create(5, 1),
        zIndex: 1,
        layerId: "layer-1",
        text: "Hello",
      }),
    ],
    layers: [Layer.create({ id: "layer-1", name: "Base", locked: true })],
  });
}

/** Full serialize → JSON string → parse → deserialize, as persistence does it. */
function roundTrip(doc: WireframeDocument): WireframeDocument {
  return deserializeDocument(
    JSON.parse(JSON.stringify(serializeDocument(doc))) as SerializedDocument,
  );
}

describe("documentSerialization", () => {
  test("serializeDocument stamps the current schema version", () => {
    expect(serializeDocument(richDocument()).version).toBe(
      DOCUMENT_SCHEMA_VERSION,
    );
  });

  test("round-trips document identity and grid size", () => {
    const restored = roundTrip(richDocument());
    expect(restored.id).toBe("doc-42");
    expect(restored.name).toBe("Login screen");
    expect(restored.gridSize.equals(GridSize.create(30, 12))).toBe(true);
  });

  test("round-trips every element's base props and kind", () => {
    const restored = roundTrip(richDocument());
    const box = restored.getElement("box");
    const line = restored.getElement("line");
    const text = restored.getElement("text");

    expect(box?.kind).toBe("box");
    expect(box?.position.equals(Position.create(1, 2))).toBe(true);
    expect(box?.size.equals(Size.create(10, 4))).toBe(true);
    expect(box?.layerId).toBe("layer-1");
    expect(line?.kind).toBe("line");
    expect(line?.zIndex).toBe(2);
    expect(line?.layerId).toBeNull();
    expect(text?.kind).toBe("text");
  });

  test("round-trips type-specific props (border style, orientation, text)", () => {
    const restored = roundTrip(richDocument());
    const box = restored.getElement("box") as BoxElement;
    const line = restored.getElement("line") as LineElement;
    const text = restored.getElement("text") as TextElement;

    expect(box.borderStyle.equals(unicodeBorder)).toBe(true);
    expect(line.orientation).toBe("h");
    expect(text.text).toBe("Hello");
  });

  test("round-trips the element name and defaults it on legacy payloads", () => {
    const restored = roundTrip(richDocument());
    expect(restored.getElement("box")?.name).toBe("Frame");
    expect(restored.getElement("line")?.name).toBeNull();

    // Version-1 payloads written before `name` existed have no such key.
    const legacy = serializeDocument(richDocument());
    delete legacy.elements[0].name;
    expect(deserializeDocument(legacy).getElement("box")?.name).toBeNull();
  });

  test("round-trips layers with their flags", () => {
    const restored = roundTrip(richDocument());
    expect(restored.layers).toHaveLength(1);
    expect(
      restored.layers[0].equals(
        Layer.create({ id: "layer-1", name: "Base", locked: true }),
      ),
    ).toBe(true);
  });

  test("deserializeDocument rejects an unsupported schema version", () => {
    const payload = serializeDocument(richDocument());
    payload.version = 999;
    expect(() => deserializeDocument(payload)).toThrow(/version 999/);
  });

  test("deserializeElement rejects an unknown element kind", () => {
    const payload = serializeDocument(richDocument());
    (payload.elements[0] as { kind: string }).kind = "carousel";
    expect(() => deserializeDocument(payload)).toThrow(/carousel/);
  });

  test("round-trips ArrowElement", () => {
    const arrow = ArrowElement.create({
      id: "arr",
      position: Position.create(1, 2),
      size: Size.create(6, 1),
      zIndex: 0,
      layerId: null,
      direction: "left",
    });
    const doc = WireframeDocument.create({
      id: "d",
      name: "n",
      gridSize: GridSize.create(10, 5),
      elements: [arrow],
    });
    const restored = roundTrip(doc).getElement("arr") as ArrowElement;
    expect(restored.kind).toBe("arrow");
    expect(restored.direction).toBe("left");
  });

  test("round-trips CardElement", () => {
    const card = CardElement.create({
      id: "crd",
      position: Position.create(0, 0),
      size: Size.create(12, 6),
      zIndex: 0,
      layerId: null,
      title: "Card",
    });
    const doc = WireframeDocument.create({
      id: "d",
      name: "n",
      gridSize: GridSize.create(15, 8),
      elements: [card],
    });
    const restored = roundTrip(doc).getElement("crd") as CardElement;
    expect(restored.kind).toBe("card");
    expect(restored.title).toBe("Card");
  });

  test("round-trips ModalElement with null title", () => {
    const modal = ModalElement.create({
      id: "mod",
      position: Position.create(0, 0),
      size: Size.create(14, 7),
      zIndex: 0,
      layerId: null,
      title: null,
    });
    const doc = WireframeDocument.create({
      id: "d",
      name: "n",
      gridSize: GridSize.create(16, 9),
      elements: [modal],
    });
    const restored = roundTrip(doc).getElement("mod") as ModalElement;
    expect(restored.kind).toBe("modal");
    expect(restored.title).toBeNull();
  });

  test("round-trips TableElement", () => {
    const table = TableElement.create({
      id: "tbl",
      position: Position.create(0, 0),
      size: Size.create(13, 7),
      zIndex: 0,
      layerId: null,
      columns: 3,
      rows: 2,
    });
    const doc = WireframeDocument.create({
      id: "d",
      name: "n",
      gridSize: GridSize.create(15, 9),
      elements: [table],
    });
    const restored = roundTrip(doc).getElement("tbl") as TableElement;
    expect(restored.kind).toBe("table");
    expect(restored.columns).toBe(3);
    expect(restored.rows).toBe(2);
  });

  test("round-trips TabsElement", () => {
    const tabs = TabsElement.create({
      id: "tab",
      position: Position.create(0, 0),
      size: Size.create(15, 2),
      zIndex: 0,
      layerId: null,
      tabs: ["Tab 1", "Tab 2"],
      active: 1,
    });
    const doc = WireframeDocument.create({
      id: "d",
      name: "n",
      gridSize: GridSize.create(20, 5),
      elements: [tabs],
    });
    const restored = roundTrip(doc).getElement("tab") as TabsElement;
    expect(restored.kind).toBe("tabs");
    expect([...restored.tabs]).toEqual(["Tab 1", "Tab 2"]);
    expect(restored.active).toBe(1);
  });

  test("round-trips FreeDrawElement", () => {
    const fd = FreeDrawElement.create({
      id: "fd",
      position: Position.create(2, 3),
      zIndex: 0,
      layerId: null,
      cells: new Map([
        [freeDrawCellKey(0, 0), CellChar.create("a")],
        [freeDrawCellKey(1, 1), CellChar.create("b")],
      ]),
    });
    const doc = WireframeDocument.create({
      id: "d",
      name: "n",
      gridSize: GridSize.create(10, 8),
      elements: [fd],
    });
    const restored = roundTrip(doc).getElement("fd") as FreeDrawElement;
    expect(restored.kind).toBe("freedraw");
    expect(restored.charAt(Position.create(2, 3))?.value).toBe("a");
    expect(restored.charAt(Position.create(3, 4))?.value).toBe("b");
  });

  test("serializeDocument rejects an element with no registered serializer", () => {
    const doc = WireframeDocument.create({
      id: "d",
      name: "n",
      gridSize: GridSize.create(5, 5),
      elements: [
        new UnmappedElement({
          id: "x",
          position: Position.create(0, 0),
          size: Size.create(1, 1),
          zIndex: 0,
          layerId: null,
        }),
      ],
    });
    expect(() => serializeDocument(doc)).toThrow(/carousel/);
  });
});
