import { describe, expect, test } from "vitest";
import { ToolRegistry, createDefaultToolRegistry } from "./ToolRegistry";
import { createPlacementTool } from "./placementTool";

describe("ToolRegistry", () => {
  test("register + get round-trips a tool", () => {
    const registry = new ToolRegistry();
    const tool = createPlacementTool("box", "Box");
    registry.register(tool);

    expect(registry.get("box")).toBe(tool);
  });

  test("register rejects duplicated ids", () => {
    const registry = new ToolRegistry();
    registry.register(createPlacementTool("box", "Box"));

    expect(() => registry.register(createPlacementTool("box", "Box2"))).toThrow(
      'tool "box" is already registered',
    );
  });

  test("get names the unknown id and the registered ones", () => {
    const registry = new ToolRegistry();
    registry.register(createPlacementTool("box", "Box"));

    expect(() => registry.get("pencil")).toThrow(
      'unknown tool "pencil"; registered tools: box',
    );
  });

  test("list returns tools in registration order", () => {
    const registry = new ToolRegistry();
    registry.register(createPlacementTool("box", "Box"));
    registry.register(createPlacementTool("line", "Line"));

    expect(registry.list().map((tool) => tool.id)).toEqual(["box", "line"]);
  });

  test("default registry ships select + box/line/text", () => {
    const registry = createDefaultToolRegistry();

    expect(registry.list().map((tool) => tool.id)).toEqual([
      "select",
      "box",
      "line",
      "text",
    ]);
  });
});
