import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TextArea } from "./TextArea";

describe("TextArea", () => {
  test("carries the daisyUI textarea classes plus layout className", () => {
    render(<TextArea aria-label="body" className="w-full" />);
    expect(screen.getByLabelText("body")).toHaveClass(
      "textarea",
      "textarea-sm",
      "w-full",
    );
  });

  test("forwards rows and keydown handlers", () => {
    const onKeyDown = vi.fn();
    render(<TextArea aria-label="body" rows={3} onKeyDown={onKeyDown} />);
    const textarea = screen.getByLabelText("body");
    expect(textarea).toHaveAttribute("rows", "3");
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});
