import { describe, expect, test } from "vitest";
import { buildElement } from "./elementFactory";
import { BoxElement } from "../../../domain/entities/element/BoxElement";
import { LineElement } from "../../../domain/entities/element/LineElement";
import { TextElement } from "../../../domain/entities/element/TextElement";
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
});
