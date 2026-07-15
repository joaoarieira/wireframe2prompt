import type { CanvasTool } from "./CanvasTool";
import { selectTool } from "./selectTool";
import { createPlacementTool } from "./placementTool";

/**
 * Open/closed registry of canvas tools, mirroring the GlyphMapperRegistry:
 * future tools (hand/pan, zoom, pencil, eraser) are added by registering a
 * strategy — no switch statements to grow.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, CanvasTool>();

  register(tool: CanvasTool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(
        `tool "${tool.id}" is already registered; tool ids must be unique`,
      );
    }
    this.tools.set(tool.id, tool);
  }

  get(toolId: string): CanvasTool {
    const tool = this.tools.get(toolId);
    if (tool === undefined) {
      throw new Error(
        `unknown tool "${toolId}"; registered tools: ${[...this.tools.keys()].join(", ")}`,
      );
    }
    return tool;
  }

  list(): readonly CanvasTool[] {
    return [...this.tools.values()];
  }
}

/** The MVP tool set: select plus one placement tool per implemented mapper. */
export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(selectTool);
  registry.register(createPlacementTool("box", "tools.box"));
  registry.register(createPlacementTool("line", "tools.line"));
  registry.register(createPlacementTool("text", "tools.text"));
  return registry;
}
