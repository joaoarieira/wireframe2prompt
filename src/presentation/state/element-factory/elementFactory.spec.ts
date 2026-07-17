import { describe, expect, test } from "vitest";
import { buildElement } from "./elementFactory";
import { BoxElement } from "../../../domain/entities/element/BoxElement";
import { LineElement } from "../../../domain/entities/element/LineElement";
import { TextElement } from "../../../domain/entities/element/TextElement";
import { ArrowElement } from "../../../domain/entities/element/ArrowElement";
import { CardElement } from "../../../domain/entities/element/CardElement";
import { ModalElement } from "../../../domain/entities/element/ModalElement";
import { TableElement } from "../../../domain/entities/element/TableElement";
import { TabsElement } from "../../../domain/entities/element/TabsElement";
import { Position } from "../../../domain/entities/position/Position";

const spec = { id: "el-1", position: Position.create(3, 2), zIndex: 5 };

describe("buildElement", () => {
  test("box: 8×4 with ASCII border defaults", () => {
    const element = buildElement("box", spec);

    expect(element).toBeInstanceOf(BoxElement);
    expect(element.id).toBe("el-1");
    expect(element.position.equals(Position.create(3, 2))).toBe(true);
    expect(element.size.width).toBe(8);
    expect(element.size.height).toBe(4);
    expect(element.zIndex).toBe(5);
    expect(element.layerId).toBeNull();
  });

  test("line: horizontal 6×1", () => {
    const element = buildElement("line", spec);

    expect(element).toBeInstanceOf(LineElement);
    expect((element as LineElement).orientation).toBe("h");
    expect(element.size.width).toBe(6);
    expect(element.size.height).toBe(1);
  });

  test("text: placeholder content sized to fit", () => {
    const element = buildElement("text", spec);

    expect(element).toBeInstanceOf(TextElement);
    expect((element as TextElement).text).toBe("Text");
    expect(element.size.width).toBe(4);
    expect(element.size.height).toBe(1);
  });

  test("arrow: 6×1 pointing right", () => {
    const element = buildElement("arrow", spec);

    expect(element).toBeInstanceOf(ArrowElement);
    expect((element as ArrowElement).direction).toBe("right");
    expect(element.size.width).toBe(6);
    expect(element.size.height).toBe(1);
  });

  test("card: 12×6 with default title", () => {
    const element = buildElement("card", spec);

    expect(element).toBeInstanceOf(CardElement);
    expect((element as CardElement).title).toBe("Card");
    expect(element.size.width).toBe(12);
    expect(element.size.height).toBe(6);
  });

  test("modal: 14×7 with default title", () => {
    const element = buildElement("modal", spec);

    expect(element).toBeInstanceOf(ModalElement);
    expect((element as ModalElement).title).toBe("Modal");
    expect(element.size.width).toBe(14);
    expect(element.size.height).toBe(7);
  });

  test("table: 13×7 with 3 columns and 2 rows", () => {
    const element = buildElement("table", spec);

    expect(element).toBeInstanceOf(TableElement);
    expect((element as TableElement).columns).toBe(3);
    expect((element as TableElement).rows).toBe(2);
    expect(element.size.width).toBe(13);
    expect(element.size.height).toBe(7);
  });

  test("tabs: 15×2 with two default tabs", () => {
    const element = buildElement("tabs", spec);

    expect(element).toBeInstanceOf(TabsElement);
    expect((element as TabsElement).tabs).toEqual(["Tab 1", "Tab 2"]);
    expect((element as TabsElement).active).toBe(0);
    expect(element.size.width).toBe(15);
    expect(element.size.height).toBe(2);
  });
});
