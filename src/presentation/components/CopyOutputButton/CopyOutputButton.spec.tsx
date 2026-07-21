import { afterEach, describe, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { CopyOutputButton } from "./CopyOutputButton";
import { editorStore } from "../../state/app-store/appStore";
import { makeBox, makeDoc } from "../../../tests/fixtures";

const writeText = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal("navigator", { clipboard: { writeText } });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  editorStore.setState({ document: null });
});

describe("CopyOutputButton", () => {
  test("keeps its accessible name but hides the label text on phones", () => {
    render(<CopyOutputButton />);
    const button = screen.getByRole("button", { name: "COPY OUTPUT" });
    expect(button).toHaveAttribute("title", "COPY OUTPUT");
    // The visible text is dropped below md; aria-label carries the name instead.
    expect(screen.getByText("COPY OUTPUT")).toHaveClass("hidden", "md:inline");
  });

  test("does nothing when no document is open", () => {
    editorStore.setState({ document: null });
    render(<CopyOutputButton />);

    fireEvent.click(screen.getByRole("button", { name: "COPY OUTPUT" }));

    expect(writeText).not.toHaveBeenCalled();
  });

  test("copies the export, flips to COPIED!, then reverts", async () => {
    vi.useFakeTimers();
    editorStore.setState({ document: makeDoc(makeBox("b1")) });
    render(<CopyOutputButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "COPY OUTPUT" }));
    });

    expect(writeText).toHaveBeenCalledOnce();
    expect(typeof writeText.mock.calls[0][0]).toBe("string");
    expect(screen.getByRole("button", { name: "COPIED!" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      screen.getByRole("button", { name: "COPY OUTPUT" }),
    ).toBeInTheDocument();
  });
});
