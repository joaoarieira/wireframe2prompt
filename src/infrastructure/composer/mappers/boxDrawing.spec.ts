import { describe, expect, test } from "vitest";
import * as box from "./boxDrawing";

describe("boxDrawing glyphs", () => {
  test("expose the Unicode box-drawing characters", () => {
    expect(box.HORIZONTAL.value).toBe("─");
    expect(box.VERTICAL.value).toBe("│");
    expect(box.TOP_LEFT.value).toBe("┌");
    expect(box.TOP_RIGHT.value).toBe("┐");
    expect(box.BOTTOM_LEFT.value).toBe("└");
    expect(box.BOTTOM_RIGHT.value).toBe("┘");
    expect(box.TEE_RIGHT.value).toBe("├");
    expect(box.TEE_LEFT.value).toBe("┤");
    expect(box.TEE_DOWN.value).toBe("┬");
    expect(box.TEE_UP.value).toBe("┴");
    expect(box.CROSS.value).toBe("┼");
  });
});
