import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { FloatingBar } from "./FloatingBar";

describe("FloatingBar", () => {
  test("owns the surface classes and merges layout className", () => {
    render(
      <FloatingBar aria-label="tools" className="absolute bottom-4">
        content
      </FloatingBar>,
    );
    const bar = screen.getByLabelText("tools");
    expect(bar).toHaveClass(
      "rounded-box",
      "border",
      "border-base-300",
      "bg-base-100",
      "shadow-lg",
      "absolute",
      "bottom-4",
    );
    expect(bar).toHaveTextContent("content");
  });
});
